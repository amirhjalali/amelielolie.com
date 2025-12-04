import cv2
import mediapipe as mp
import numpy as np
import os

# --- CONFIGURATION ---
IMAGE_PATH = '../public/assets/mask_photo.jpg'  # Your mask image filename
OBJ_PATH = 'canonical_face_model.obj' # The downloaded OBJ file
OUTPUT_SIZE = (1024, 1024)     # Resolution of the output texture

def load_uvs_from_obj(obj_path):
    """Parses the OBJ file to get UV coordinates for the 468 vertices."""
    uvs = []
    if not os.path.exists(obj_path):
        print(f"Error: OBJ file not found at {obj_path}")
        return []
        
    with open(obj_path, 'r') as f:
        for line in f:
            if line.startswith('vt '):
                parts = line.split()
                # OBJ UVs are (u, v). We typically ignore the 3rd dim if present.
                uvs.append([float(parts[1]), float(parts[2])])
    # The canonical model might have more UVs than vertices, 
    # but for Face Mesh, the first 468 usually align with the landmarks.
    return np.array(uvs[:468])

def warp_triangle(img, src_tri, dst_tri, size):
    """Warps a triangular region from img (src_tri) to a destination (dst_tri)."""
    # Find bounding box of the destination triangle
    r_dst = cv2.boundingRect(np.float32([dst_tri]))
    (x_dst, y_dst, w_dst, h_dst) = r_dst

    # Offset points by the top-left corner of the bounding box
    dst_tri_rect = []
    for point in dst_tri:
        dst_tri_rect.append(((point[0] - x_dst), (point[1] - y_dst)))

    # Get the mask for the destination triangle
    mask = np.zeros((h_dst, w_dst, 3), dtype=np.uint8)
    cv2.fillConvexPoly(mask, np.int32(dst_tri_rect), (1, 1, 1), 16, 0)

    # Find bounding box of the source triangle
    r_src = cv2.boundingRect(np.float32([src_tri]))
    (x_src, y_src, w_src, h_src) = r_src

    # Crop the source image to the bounding box
    img_rect = img[y_src:y_src + h_src, x_src:x_src + w_src]

    # Offset source points
    src_tri_rect = []
    for point in src_tri:
        src_tri_rect.append(((point[0] - x_src), (point[1] - y_src)))

    # Calculate Affine Transform and Apply
    M = cv2.getAffineTransform(np.float32(src_tri_rect), np.float32(dst_tri_rect))
    warped_rect = cv2.warpAffine(img_rect, M, (w_dst, h_dst))

    # Return the warped triangle masked (pixels outside triangle are black)
    return warped_rect * mask, (x_dst, y_dst, w_dst, h_dst)

def main():
    # Check if image exists
    if not os.path.exists(IMAGE_PATH):
        print(f"Error: Image file not found at {IMAGE_PATH}")
        print("Please place a 'mask_photo.jpg' in the current directory.")
        return

    # 1. Initialize MediaPipe Face Mesh
    mp_face_mesh = mp.solutions.face_mesh
    face_mesh = mp_face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=False)

    # 2. Load Image and Detect Landmarks
    image = cv2.imread(IMAGE_PATH)
    if image is None:
        print(f"Error: Could not read image at {IMAGE_PATH}")
        return

    h_img, w_img, _ = image.shape
    results = face_mesh.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))

    if not results.multi_face_landmarks:
        print("Error: No face detected in the mask image.")
        return

    landmarks = results.multi_face_landmarks[0].landmark
    src_points = np.array([(lm.x * w_img, lm.y * h_img) for lm in landmarks])

    # 3. Load Canonical UVs (Destination)
    uvs = load_uvs_from_obj(OBJ_PATH)
    if len(uvs) == 0:
        return

    dst_points = np.array([(uv[0] * OUTPUT_SIZE[0], (1 - uv[1]) * OUTPUT_SIZE[1]) for uv in uvs])

    # 4. Create the Texture (Warping)
    texture_map = np.zeros((OUTPUT_SIZE[1], OUTPUT_SIZE[0], 3), dtype=np.uint8)
    
    # We use the standard MediaPipe triangulation (connections) to define triangles
    # Note: For a perfect mesh, we should load the face geometry index buffer. 
    # For this simplified script, we can use Delaunay on the 2D UV map 
    # to ensure we cover the whole texture map without holes.
    rect = (0, 0, OUTPUT_SIZE[0], OUTPUT_SIZE[1])
    subdiv = cv2.Subdiv2D(rect)
    for p in dst_points:
        subdiv.insert((float(p[0]), float(p[1])))
    
    triangle_list = subdiv.getTriangleList()

    for t in triangle_list:
        # Get indices of the triangle vertices in the dst_points list
        pt1 = (t[0], t[1])
        pt2 = (t[2], t[3])
        pt3 = (t[4], t[5])
        
        # Helper to find the index of the point (slow but functional for one-off script)
        # In production, use the standard FaceMesh index buffer instead of Delaunay
        try:
            idx1 = np.where((dst_points == pt1).all(axis=1))[0][0]
            idx2 = np.where((dst_points == pt2).all(axis=1))[0][0]
            idx3 = np.where((dst_points == pt3).all(axis=1))[0][0]
        except IndexError:
            continue # Skip triangles that touch the outer boundary box

        src_tri = np.float32([src_points[idx1], src_points[idx2], src_points[idx3]])
        dst_tri = np.float32([dst_points[idx1], dst_points[idx2], dst_points[idx3]])

        warped_triangle, (x, y, w, h) = warp_triangle(image, src_tri, dst_tri, OUTPUT_SIZE)

        # Add to final texture
        # We need to blend it carefully; simplistic addition here:
        texture_area = texture_map[y:y+h, x:x+w]
        texture_map[y:y+h, x:x+w] = np.where(warped_triangle != 0, warped_triangle, texture_area)

    # 5. Save Output
    cv2.imwrite("face_texture_uv.png", texture_map)
    print("Texture saved as face_texture_uv.png")

if __name__ == "__main__":
    main()

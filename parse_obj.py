import re

def parse_obj(obj_path, output_path):
    vertices = []
    uv_coords = []
    # Map vertex index (0-based) to uv index (0-based)
    vertex_uv_map = {}
    indices = []

    with open(obj_path, 'r') as f:
        for line in f:
            if line.startswith('v '):
                vertices.append(line)
            elif line.startswith('vt '):
                parts = line.strip().split()[1:]
                uv_coords.append([float(parts[0]), float(parts[1])])
            elif line.startswith('f '):
                parts = line.strip().split()[1:]
                # OBJ is 1-based
                # Format is v/vt or v/vt/vn
                face_indices = []
                for p in parts:
                    subparts = p.split('/')
                    v_idx = int(subparts[0]) - 1
                    vt_idx = int(subparts[1]) - 1 if len(subparts) > 1 and subparts[1] else -1
                    
                    face_indices.append(v_idx)
                    
                    if vt_idx != -1:
                        # Store the UV index for this vertex
                        # If a vertex has multiple UVs (seam), this will overwrite, 
                        # but for FaceMesh we need 1 UV per vertex.
                        if v_idx not in vertex_uv_map:
                            vertex_uv_map[v_idx] = vt_idx

                if len(face_indices) == 3:
                    indices.extend(face_indices)
                elif len(face_indices) == 4:
                    indices.extend([face_indices[0], face_indices[1], face_indices[2]])
                    indices.extend([face_indices[0], face_indices[2], face_indices[3]])

    # Build final UV array for the 468 vertices
    final_uvs = []
    num_vertices = 468 # We expect 468 for FaceMesh
    
    for i in range(num_vertices):
        if i in vertex_uv_map:
            uv_idx = vertex_uv_map[i]
            u, v = uv_coords[uv_idx]
            final_uvs.extend([u, v])
        else:
            # Default if missing
            final_uvs.extend([0.0, 0.0])

    with open(output_path, 'w') as f:
        f.write('export const TRIANGULATION = [\n')
        f.write(', '.join(map(str, indices)))
        f.write('\n];\n\n')
        
        f.write('export const UVS = [\n')
        f.write(', '.join(map(str, final_uvs)))
        f.write('\n];\n')

if __name__ == '__main__':
    parse_obj('src/utils/canonical_face_model.obj', 'src/utils/triangulation.ts')

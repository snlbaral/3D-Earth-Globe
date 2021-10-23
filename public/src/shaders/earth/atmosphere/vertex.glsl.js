const vertex = `varying vec3 vNormal;
void main() {
    gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.0);
    vNormal = normalize(normalMatrix*normal);
}`
export default vertex
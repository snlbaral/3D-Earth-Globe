const vertex = `attribute vec3 lineColor;
varying vec2 vUv;
varying vec3 vPosition;

float random (vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233)))*43758.5453123);
}
void main() {
    gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);
    vUv = uv;
    vPosition = position;
}`
export default vertex
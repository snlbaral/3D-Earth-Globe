const fragment = `uniform float time;
varying vec2 vUv;
varying vec3 vPosition;

vec3 hueGradient(float t) {
    vec3 p = abs(fract(t + vec3(1.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);
	return (clamp(p - 1.0, 0.0, 1.0));
}

void main() {
    float dash = sin(vUv.x*5.0-(time*5.0));
    if(dash<0.5) discard;
    gl_FragColor = vec4(hueGradient(vPosition.y),1.0);
}`

export default fragment
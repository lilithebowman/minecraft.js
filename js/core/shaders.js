// Vertex and fragment shader sources for cubes and spheres
export const cubeVertexShader = `
attribute vec3 position;
attribute vec3 color;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
varying vec3 vColor;
void main() {
    vColor = color;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export const cubeFragmentShader = `
varying vec3 vColor;
void main() {
    gl_FragColor = vec4(vColor, 1.0);
}`;

export const sphereVertexShader = cubeVertexShader;
export const sphereFragmentShader = cubeFragmentShader;

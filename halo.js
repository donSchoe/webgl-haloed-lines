var fragShaderSource = "\
precision highp float;\
uniform vec4 u_color;\
void main(void) {\
gl_FragColor = u_color;\
}\
";

var vtxShaderSource = "\
attribute vec3 a_position;\
uniform vec4 u_color;\
uniform mat4 u_mvMatrix;\
uniform mat4 u_pMatrix;\
void main(void) {\
gl_Position = u_pMatrix * u_mvMatrix * vec4(a_position, 1.0);\
}\
";

function get_shader(type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

var gl, pMatrix, mvMatrix, vbuf,ibuf;

function initGl() {
    var canvas = document.getElementsByTagName('canvas')[0];
    gl = canvas.getContext("experimental-webgl", { antialias: true });
    gl.viewport(0, 0, canvas.width, canvas.height);
}

function initShaders() {
    var vertexShader = get_shader(gl.VERTEX_SHADER, vtxShaderSource);
    var fragmentShader = get_shader(gl.FRAGMENT_SHADER, fragShaderSource);
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);
    shaderProgram.aposAttrib = gl.getAttribLocation(shaderProgram, "a_position");
    gl.enableVertexAttribArray(shaderProgram.aposAttrib);
    shaderProgram.colorUniform = gl.getUniformLocation(shaderProgram, "u_color");
    shaderProgram.pMUniform = gl.getUniformLocation(shaderProgram, "u_pMatrix");
    shaderProgram.mvMUniform = gl.getUniformLocation(shaderProgram, "u_mvMatrix");
}

function initScene() {
    // Model view
    mvMatrix =  [ 0.8,  0.0,  0.0,  0.0,
                  0.0,  1.0,  0.0,  0.0,
                  0.3, -0.3,  0.3,  0.0,
                  0.0,  0.0, -6.0,  1.0];
    // Perspective
    pMatrix =   [ 3.0,  0.0,  0.0,  0.0,
                  0.0,  3.0,  0.0,  0.0,
                  0.0,  0.0, -1.0, -1.0,
                  0.0,  0.0, -0.2,  0.0]; // @TODO
    mat4.perspective(pMatrix, 20.0, 400.0 / 300.0, 0.1, 1000.0);
    gl.clearColor(1.0,  1.0,  1.0,  0.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(shaderProgram.pMUniform, false, new Float32Array(pMatrix));
    gl.uniformMatrix4fv(shaderProgram.mvMUniform, false, new Float32Array(mvMatrix));
}

function initBuffer(glELEMENT_ARRAY_BUFFER, data) {
    var buf = gl.createBuffer();
    gl.bindBuffer(glELEMENT_ARRAY_BUFFER, buf);
    gl.bufferData(glELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return buf;
}

function initBuffers(vtx, idx) {
    vbuf = initBuffer(gl.ARRAY_BUFFER, vtx);
    ibuf = initBuffer(gl.ELEMENT_ARRAY_BUFFER, idx);
    gl.vertexAttribPointer(shaderProgram.aposAttrib, 3, gl.FLOAT, false, 0, 0);
}

function onready() {
    initGl();
    initShaders();
    initScene();
    // Update every 50ms
    setInterval('updateScene();', 50);
}

function updateScene() {
    gl.clearColor(1.0,  1.0,  1.0,  0.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // Rotate 3° in any direction
    var rotation = 3.0 / 360.0;
    mat4.rotateX(mvMatrix, mvMatrix, rotation);
    mat4.rotateY(mvMatrix, mvMatrix, rotation);
    mat4.rotateZ(mvMatrix, mvMatrix, rotation);
    gl.uniformMatrix4fv(shaderProgram.mvMUniform, false, mvMatrix);
    // Call haloed lines algorithm
    haloLines();
    unbindBuffers();
}

function haloLines() {
    // Enables material coloring.
    gl.enable(gl.COLOR_MATERIAL);
    // Disables color buffer. 
    gl.colorMask(false, false, false, false);
    // Enables depth buffer for writing halos.
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    gl.depthMask(true);
    // Increases line width.
    gl.lineWidth(7.0);
    // Renders halos without color.
    drawLines();
    // Enables writing to the color buffer.
    gl.colorMask(true, true, true, true);
    // Ensures depth testing is on, passes GL_LEQUAL. 
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    // Restores line width.
    gl.lineWidth(3.0);
    // Renders lines with color buffer.
    drawLines();
}

function drawLines() {
    // Cube vertices
    var vtx = new Float32Array([-1.0, -1.0,  1.0,
                                 1.0, -1.0,  1.0,
                                 1.0,  1.0,  1.0,
                                -1.0,  1.0,  1.0,
                                -1.0, -1.0, -1.0,
                                -1.0,  1.0, -1.0,
                                 1.0,  1.0, -1.0,
                                 1.0, -1.0, -1.0]);
    // Cube indices
    var idx = new Uint16Array([0, 1, 1, 2, 2, 3, 3, 0,
                               4, 5, 5, 6, 6, 7, 7, 4,
                               0, 4, 1, 7, 2, 6, 3, 5,
                               0, 2, 4, 3, 5, 7, 1, 6, 0, 7, 2, 5]);
    initBuffers(vtx, idx);
    gl.uniform4f(shaderProgram.colorUniform, 0.3, 0.3, 0.3, 1.0);
    gl.drawElements(gl.LINES, 36, gl.UNSIGNED_SHORT, 0);
}

function unbindBuffers() {
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}
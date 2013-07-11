var fragShaderSource = "\
precision highp float;\
uniform vec4 u_color;\
varying vec3 v_lighting;\
void main(void) {\
    gl_FragColor = vec4(u_color.rgb * v_lighting, u_color.a);\
}\
";

var vtxShaderSource = "\
attribute vec3 a_position;\
attribute vec3 a_normal;\
uniform vec4 u_color;\
uniform mat4 u_mvMatrix;\
uniform mat4 u_pMatrix;\
uniform mat4 u_nrMatrix;\
varying vec3 v_lighting;\
void main(void) {\
    gl_Position = u_pMatrix * u_mvMatrix * vec4(a_position, 1.0);\
    vec3 ambientLight = vec3(0.5, 0.5, 0.9);\
    vec3 directionalColor = vec3(1.0, 1.0, 0.0);\
    vec3 directionalVector = vec3(-1.0, -1.0, 0.0);\
    vec4 transformedNormal = u_nrMatrix * vec4(a_normal, 1.0);\
    float directional = max(dot(transformedNormal.xyz, directionalVector), 0.1);\
    v_lighting = ambientLight + (directionalColor * directional);\
}\
";

function get_shader(type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

var gl, pMatrix, mvMatrix, vbuf, ibuf;

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
    mvMatrix =  [ 1.0, 0.0,  0.0, 0.0,
                  0.0, 1.0,  0.0, 0.0,
                  0.0, 0.0,  1.0, 0.0,
                  0.0, 0.0, -4.0, 1.0];
    /* mvMatrix = [0.0, 0.0, 0.0, 0.0,
               0.0, 0.0, 0.0, 0.0,
               0.0, 0.0, 0.0, 0.0,
               0.0, 0.0, 0.0, 0.0];
    mat4.lookAt(mvMatrix, vec3(8.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), vec3(0.3, -0.3, 0.3)); */ // @TODO
    // Perspective
    pMatrix = [0.0, 0.0, 0.0, 0.0,
               0.0, 0.0, 0.0, 0.0,
               0.0, 0.0, 0.0, 0.0,
               0.0, 0.0, 0.0, 0.0];
    mat4.perspective(pMatrix, 1.0, 400.0 / 300.0, 0.1, 1000.0);
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

function onready() {
    initGl();
    initShaders();
    initScene();
    // Update every 10ms
    setInterval('updateScene();', 10);
}

function updateScene() {
    gl.clearColor(1.0,  1.0,  1.0,  0.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // Rotate 1° in y-direction
    var rotation = -4.0 / 360.0;
    //mat4.rotateX(mvMatrix, mvMatrix, rotation);
    mat4.rotateY(mvMatrix, mvMatrix, rotation);
    //mat4.rotateZ(mvMatrix, mvMatrix, rotation);
    gl.uniformMatrix4fv(shaderProgram.mvMUniform, false, mvMatrix);
    // Call haloed lines algorithm
    haloedLines();
    unbindBuffers();
}

function haloedLines() {
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
    var vtx = new Float32Array([// Front face
                                -1.0, -1.0,  1.0,
                                 1.0, -1.0,  1.0,
                                 1.0,  1.0,  1.0,
                                -1.0,  1.0,  1.0,
                                // Back face
                                -1.0, -1.0, -1.0,
                                -1.0,  1.0, -1.0,
                                 1.0,  1.0, -1.0,
                                 1.0, -1.0, -1.0, 
                                // Top face
                                -1.0,  1.0, -1.0,
                                -1.0,  1.0,  1.0,
                                 1.0,  1.0,  1.0, 
                                 1.0,  1.0, -1.0,
                                // Bottom face
                                -1.0, -1.0, -1.0,
                                 1.0, -1.0, -1.0,
                                 1.0, -1.0,  1.0,
                                -1.0, -1.0,  1.0,
                                // Right face
                                 1.0, -1.0, -1.0,
                                 1.0,  1.0, -1.0,
                                 1.0,  1.0,  1.0,
                                 1.0, -1.0,  1.0,
                                // Left face
                                -1.0, -1.0, -1.0,
                                -1.0, -1.0,  1.0,
                                -1.0,  1.0,  1.0,
                                -1.0,  1.0, -1.0 ]);
  // Cube normals
  var nrx = new Float32Array([  // Front face
                                 0.0,  0.0,  1.0,
                                 0.0,  0.0,  1.0,
                                 0.0,  0.0,  1.0,
                                 0.0,  0.0,  1.0,
                                // Back face
                                 0.0,  0.0, -1.0,
                                 0.0,  0.0, -1.0,
                                 0.0,  0.0, -1.0,
                                 0.0,  0.0, -1.0,
                                // Top face
                                 0.0,  1.0,  0.0,
                                 0.0,  1.0,  0.0,
                                 0.0,  1.0,  0.0,
                                 0.0,  1.0,  0.0,
                                // Bottom face
                                 0.0, -1.0,  0.0,
                                 0.0, -1.0,  0.0,
                                 0.0, -1.0,  0.0,
                                 0.0, -1.0,  0.0,
                                // Right face
                                 1.0,  0.0,  0.0,
                                 1.0,  0.0,  0.0,
                                 1.0,  0.0,  0.0,
                                 1.0,  0.0,  0.0,
                                // Left face
                                -1.0,  0.0,  0.0,
                                -1.0,  0.0,  0.0,
                                -1.0,  0.0,  0.0,
                                -1.0,  0.0,  0.0 ]);
    // Cube indices
    var idx = new Uint16Array([// Front face
                                0,  1,  1,  2,  2,  3,  3,  0,  //0,  2,
                               // Back face
                                4,  5,  5,  6,  6,  7,  7,  4,  //5,  7,
                               // Top face
                                8,  9,  9, 10, 10, 11, 11,  8,  //9, 11,
                               // Bottom face
                               12, 13, 13, 14, 14, 15, 15, 12, //12, 14,
                               // Right face
                               16, 17, 17, 18, 18, 19, 19, 16, //16, 18,
                               // Left face
                               20, 21, 21, 22, 22, 23, 23, 20/*, 21, 23*/ ]);
    vbuf = initBuffer(gl.ARRAY_BUFFER, vtx);
    ibuf = initBuffer(gl.ELEMENT_ARRAY_BUFFER, idx);
    gl.vertexAttribPointer(shaderProgram.aposAttrib, 3, gl.FLOAT, false, 0, 0);
    gl.uniform4f(shaderProgram.colorUniform, 0.6, 0.6, 0.6, 1.0);
    gl.drawElements(gl.LINES, 48, gl.UNSIGNED_SHORT, 0);
    // Prepare normals for shader
    nbuf = initBuffer(gl.ARRAY_BUFFER, nrx);
    gl.bindBuffer(gl.ARRAY_BUFFER, nbuf);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);
    var nrMatrix = [0.0, 0.0, 0.0, 0.0,
                    0.0, 0.0, 0.0, 0.0,
                    0.0, 0.0, 0.0, 0.0,
                    0.0, 0.0, 0.0, 0.0];
    mat4.invert(nrMatrix, mvMatrix);
    mat4.transpose(nrMatrix, nrMatrix);
    var nrMUniform = gl.getUniformLocation(shaderProgram, "u_nrMatrix");
    gl.uniformMatrix4fv(nrMUniform, false, new Float32Array(nrMatrix));
}

function unbindBuffers() {
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}
//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// Chapter 5: ColoredTriangle.js (c) 2012 matsuda  AND
// Chapter 4: RotatingTriangle_withButtons.js (c) 2012 matsuda
// became:
//
// ColoredMultiObject.js  MODIFIED for EECS 351-1, 
//									Northwestern Univ. Jack Tumblin
//		--converted from 2D to 4D (x,y,z,w) vertices
//		--demonstrate how to keep & use MULTIPLE colored shapes in just one
//			Vertex Buffer Object(VBO). 
//		--demonstrate 'nodes' vs. 'vertices'; geometric corner locations where
//				OpenGL/WebGL requires multiple co-located vertices to implement the
//				meeting point of multiple diverse faces.
//
// Vertex shader program----------------------------------
var VSHADER_SOURCE = 
  'uniform mat4 u_ModelMatrix;\n' +
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '  gl_PointSize = 10.0;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program----------------------------------
var FSHADER_SOURCE = 
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif GL_ES\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

// Global Variable -- Rotation angle rate (degrees/second)
var ANGLE_STEP = 45.0;
var floatsPerVertex = 7;
var translate = 0;
var press = false; 

var xMdragTot = 0;
var yMdragTot = 0;

function main() {
//==============================================================================
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // 
  var n = initVertexBuffer(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  canvas.onmousedown  = function(ev){myMouseDown( ev, gl, canvas) }; 
  
            // when user's mouse button goes down call mouseDown() function
  canvas.onmousemove =  function(ev){myMouseMove( ev, gl, canvas) };
  
                      // call mouseMove() function          
  canvas.onmouseup =    function(ev){myMouseUp(   ev, gl, canvas)};

  // Next, register all keyboard events found within our HTML webpage window:
  window.addEventListener("keydown", myKeyDown, false);
  window.addEventListener("keyup", myKeyUp, false);
  window.addEventListener("keypress", myKeyPress, false);
  // The 'keyDown' and 'keyUp' events respond to ALL keys on the keyboard,
  //      including shift,alt,ctrl,arrow, pgUp, pgDn,f1,f2...f12 etc. 
  //      I find these most useful for arrow keys; insert/delete; home/end, etc.
  // The 'keyPress' events respond only to alpha-numeric keys, and sense any 
  //      modifiers such as shift, alt, or ctrl.  I find these most useful for
  //      single-number and single-letter inputs that include SHIFT,CTRL,ALT.

  // END Mouse & Keyboard Event-Handlers-----------------------------------

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

	// NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
	// unless the new Z value is closer to the eye than the old one..
//	gl.depthFunc(gl.LESS);
	gl.enable(gl.DEPTH_TEST); 	  
	
  // Get handle to graphics system's storage location of u_ModelMatrix
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
  // Create a local version of our model matrix in JavaScript 
  var modelMatrix = new Matrix4();
  
  // Create, init current rotation angle value in JavaScript
  var currentAngle = 21.0;

//-----------------  

  // Start drawing: create 'tick' variable whose value is this function:
  var tick = function() {
    currentAngle = animate(currentAngle);  // Update the rotation angle
    draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix);   // Draw shapes
    console.log('currentAngle=',currentAngle);
    requestAnimationFrame(tick, canvas);   
    									// Request that the browser re-draw the webpage
  };
  tick();							// start (and continue) animation: draw current image
	
}

function initVertexBuffer(gl) {
//==============================================================================
	var c30 = Math.sqrt(0.75);					// == cos(30deg) == sqrt(3) / 2
	var sq2	= Math.sqrt(2.0);
			 

  var colorShapes = new Float32Array([
  // Vertex coordinates(x,y,z,w) and color (R,G,B) for a color tetrahedron:
	//		Apex on +z axis; equilateral triangle base at z=0
/*	Nodes:
		 0.0,	 0.0, sq2, 1.0,			1.0, 	1.0,	1.0,	// Node 0 (apex, +z axis;  white)
     c30, -0.5, 0.0, 1.0, 		0.0,  0.0,  1.0, 	// Node 1 (base: lower rt; red)
     0.0,  1.0, 0.0, 1.0,  		1.0,  0.0,  0.0,	// Node 2 (base: +y axis;  grn)
    -c30, -0.5, 0.0, 1.0, 		0.0,  1.0,  0.0, 	// Node 3 (base:lower lft; blue)

*/
			// Face 0: (left side)
     0.0,	 0.0, sq2, 1.0,			1.0, 	1.0,	1.0,	// Node 0
     c30, -0.5, 0.0, 1.0, 		0.0,  0.0,  1.0, 	// Node 1
     0.0,  1.0, 0.0, 1.0,  		1.0,  0.0,  0.0,	// Node 2
			// Face 1: (right side)
		 0.0,	 0.0, sq2, 1.0,			1.0, 	1.0,	1.0,	// Node 0
     0.0,  1.0, 0.0, 1.0,  		1.0,  0.0,  0.0,	// Node 2
    -c30, -0.5, 0.0, 1.0, 		0.0,  1.0,  0.0, 	// Node 3
    	// Face 2: (lower side)
		 0.0,	 0.0, sq2, 1.0,			1.0, 	1.0,	1.0,	// Node 0 
    -c30, -0.5, 0.0, 1.0, 		0.0,  1.0,  0.0, 	// Node 3
     c30, -0.5, 0.0, 1.0, 		0.0,  0.0,  1.0, 	// Node 1 
     	// Face 3: (base side)  
    -c30, -0.5, -0.2, 1.0, 		0.0,  1.0,  0.0, 	// Node 3
     0.0,  1.0, -0.2, 1.0,  	1.0,  0.0,  0.0,	// Node 2
     c30, -0.5, -0.2, 1.0, 		0.0,  0.0,  1.0, 	// Node 1
 
/*    // Cube Nodes
    -1.0, -2.0, -1.0, 1.0	// Node 0
    -1.0,  2.0, -1.0, 1.0	// Node 1
     1.0,  2.0, -1.0, 1.0	// Node 2
     1.0, -2.0, -1.0, 1.0	// Node 3
    
     1.0,  2.0,  1.0, 1.0	// Node 4
    -1.0,  2.0,  1.0, 1.0	// Node 5
    -1.0, -2.0,  1.0, 1.0	// Node 6
     1.0, -2.0,  1.0, 1.0	// Node 7
*/



     1.0, -2.0, -1.0, 1.0,    0.0, 1.0, 0.0,  // Node 3
     1.0,  2.0, -1.0, 1.0,    1.0, 0.0, 0.0,  // Node 2
     1.0,  2.0,  1.0, 1.0,    1.0, 0.0, 0.0,  // Node 4
     
     1.0,  2.0,  1.0, 1.0,    1.0, 0.1, 0.1,  // Node 4
     1.0, -2.0,  1.0, 1.0,    1.0, 0.1, 0.1,  // Node 7
     1.0, -2.0, -1.0, 1.0,    1.0, 0.1, 0.1,  // Node 3

    // +y face: GREEN
    -1.0,  2.0, -1.0, 1.0,    0.0, 1.0, 0.0,  // Node 1
    -1.0,  2.0,  1.0, 1.0,    0.0, 1.0, 0.0,  // Node 5
     1.0,  2.0,  1.0, 1.0,    0.0, 1.0, 0.0,  // Node 4

     1.0,  2.0,  1.0, 1.0,    0.1, 1.0, 0.1,  // Node 4
     1.0,  2.0, -1.0, 1.0,    0.1, 1.0, 0.1,  // Node 2 
    -1.0,  2.0, -1.0, 1.0,    0.1, 1.0, 0.1,  // Node 1

    // +z face: BLUE
    -1.0,  2.0,  1.0, 1.0,    0.4, 0.3, 1.0,  // Node 5
    -1.0, -2.0,  1.0, 1.0,    0.4, 0.2, 1.0,  // Node 6
     1.0, -2.0,  1.0, 1.0,    0.2, 0.1, 1.0,  // Node 7

     1.0, -2.0,  1.0, 1.0,    0.4, 0.1, 1.0,  // Node 7
     1.0,  2.0,  1.0, 1.0,    0.6, 0.1, 1.0,  // Node 4
    -1.0,  2.0,  1.0, 1.0,    0.8, 0.1, 1.0,  // Node 5

    // -x face: CYAN
    -1.0, -2.0,  1.0, 1.0,    0.0, 1.0, 1.0,  // Node 6 
    -1.0,  2.0,  1.0, 1.0,    0.0, 1.0, 1.0,  // Node 5 
    -1.0,  2.0, -1.0, 1.0,    0.0, 1.0, 1.0,  // Node 1
    
    -1.0,  2.0, -1.0, 1.0,    0.1, 1.0, 1.0,  // Node 1
    -1.0, -2.0, -1.0, 1.0,    0.1, 1.0, 1.0,  // Node 0  
    -1.0, -2.0,  1.0, 1.0,    0.1, 1.0, 1.0,  // Node 6  
    
    // -y face: MAGENTA
     1.0, -2.0, -1.0, 1.0,    1.0, 0.0, 1.0,  // Node 3
     1.0, -2.0,  1.0, 1.0,    1.0, 0.0, 1.0,  // Node 7
    -1.0, -2.0,  1.0, 1.0,    1.0, 0.0, 1.0,  // Node 6

    -1.0, -2.0,  1.0, 1.0,    1.0, 0.1, 1.0,  // Node 6
    -1.0, -2.0, -1.0, 1.0,    1.0, 0.1, 1.0,  // Node 0
     1.0, -2.0, -1.0, 1.0,    1.0, 0.1, 1.0,  // Node 3

     // -z face: YELLOW
     1.0,  2.0, -1.0, 1.0,    1.0, 1.0, 0.0,  // Node 2
     1.0, -2.0, -1.0, 1.0,    1.0, 1.0, 0.0,  // Node 3
    -1.0, -2.0, -1.0, 1.0,    1.0, 1.0, 0.0,  // Node 0   

    -1.0, -2.0, -1.0, 1.0,    1.0, 1.0, 0.1,  // Node 0
    -1.0,  2.0, -1.0, 1.0,    1.0, 1.0, 0.1,  // Node 1
     1.0,  2.0, -1.0, 1.0,    1.0, 1.0, 0.1,  // Node 2

     



     // pyramid

     // -1, 0,  1, 1      -- node 0
     //  1, 0,  1, 1  -- node 1
     //  1, 0, -1, 1  -- node 2
     // -1, 0, -1, 1 -- node 3
     //  0, 1,  0, 1  -- node 4

     -1, 0,  1, 1,      1.0, .1, 0.0, // node 0
      1, 0,  1, 1,      1.0, .1, 0.0, // node 1
      0, 1,  0, 1,      .5, .1, 0.0, // node 4

      1, 0,  1, 1,      1.0, .9, 0.0, // node 1
      1, 0, -1, 1,      1.0, .9, 0.0, // node 2
      0, 1,  0, 1,      1.0, .9, 0.0, // node 4

      1, 0, -1, 1,      .1, .5, 0.0, // node 2
     -1, 0, -1, 1,      .1, .5, 0.0, // node 3
      0, 1,  0, 1,      .1, .5, 0.0, // node 4

     -1, 0,  1, 1,      .8, 1.0, 0.0, // node 0
     -1, 0, -1, 1,      .8, .5, 0.0, // node 3
      0, 1,  0, 1,      .8, .2, 0.0, // node 4

     -1, 0,  1, 1,      .4, 0.2, 0.1, // node 0
      1, 0,  1, 1,      .4, 1.0, 0.1, // node 1
     -1, 0, -1, 1,      .4, .9, 0.1, // node 3

      1, 0,  1, 1,      .4,  1.0,  0.1, // node 1
     -1, 0, -1, 1,      .4, 1.0, 0.1, // node 3
      1, 0, -1, 1,      .4, 1.0, 0.1, // node 2

      // half pyramid

     // -1,  1,  1, 1, -- node 0
     // -2, -2,  2, 1, -- node 1
     //  2, -2,  2, 1, -- node 2
     //  1,  1,  1, 1, -- node 3
     // 1,  1, -1, 1, -- node 4
     //  2, -2, -2, 1, -- node 5
     // -2, -2, -2, 1, -- node 6
     // -1,  1, -1, 1, -- node 7

      // facing me
      -1,  1,  1, 1,      1.0, .1, 0.0, // node 0
      -2, -2,  2, 1,      1.0, .1, 0.0, // node 1
       1,  1,  1, 1,       .5, .1, 0.0, // node 3

      -2, -2,  2, 1,      1.0, .9, 0.0, // node 1
       2, -2,  2, 1,      1.0, .9, 0.0, // node 2
       1,  1,  1, 1,       .5, .9, 0.0, // node 3

       // right side face
       2, -2,  2, 1,      .4,  1.0,  0.1, // node 2
       1,  1,  1, 1,      .4, 1.0, 0.1, // node 3
       1,  1, -1, 1,      .4, 1.0, 0.1, // node 4

       2, -2,  2, 1,      .4,  1.0,  0.1, // node 2
       1,  1, -1, 1,      .4, 1.0, 0.1, // node 4
       2, -2, -2, 1,      .4, 1.0, 0.1, // node 5

       // back face
       1,  1, -1, 1,      .4, 0.2, 0.1, // node 4
      -2, -2, -2, 1,      .4, 1.0, 0.1, // node 6
      -1,  1, -1, 1,     .4, .9, 0.1, // node 7

       1,  1, -1, 1,     .4, 0.2, 0.1, // node 4
       2, -2, -2, 1,      .4, 1.0, 0.1, // node 5
      -2, -2, -2, 1,      .4, .9, 0.1, // node 6

      // left face
      -1,  1,  1, 1,      .8, 1.0, 0.0, // node 0
      -1,  1, -1, 1,      .8, .5, 0.0, // node 7
      -2, -2, -2, 1,      .8, .2, 0.0, // node 6

      -1,  1,  1, 1,      .8, 1.0, 0.0, // node 0
      -2, -2,  2, 1,      .8, .5, 0.0, // node 1
      -2, -2, -2, 1,      .8, .2, 0.0, // node 6

      // bottom
      -2, -2,  2, 1,      .8, 1.0, 0.0, // node 1
       2, -2,  2, 1,      .8, .5, 0.0, // node 2
      -2, -2, -2, 1,      .8, .2, 0.0, // node 6

       2, -2,  2, 1,      .8, 1.0, 0.0, // node 2
       2, -2, -2, 1,      .8, .5, 0.0, // node 5
      -2, -2, -2, 1,      .8, .2, 0.0, // node 6






  ]);
  var nn = 102;		// 12 tetrahedron vertices; 36 cube verts (6 per side*6 sides); 18 vertices

  //for(j=0; j< torVerts.length; i++, j++) {
    //console.log(colorShapes[i]);
    //console.log(torVerts[j]);
 //   colorShapes[i] = torVerts[j];
  //}

  console.log(colorShapes);
  console.log(colorShapes.length);

  //console.log(Math.sin(21));
	
  // Create a buffer object
  var shapeBufferHandle = gl.createBuffer();  
  if (!shapeBufferHandle) {
    console.log('Failed to create the shape buffer object');
    return false;
  }

  // Bind the the buffer object to target:
  gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
  // Transfer data from Javascript array colorShapes to Graphics system VBO
  // (Use sparingly--may be slow if you transfer large shapes stored in files)
  gl.bufferData(gl.ARRAY_BUFFER, colorShapes, gl.STATIC_DRAW);

  var FSIZE = colorShapes.BYTES_PER_ELEMENT; // how many bytes per stored value?
    
  //Get graphics system's handle for our Vertex Shader's position-input variable: 
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  // Use handle to specify how to retrieve position data from our VBO:
  gl.vertexAttribPointer(
  		a_Position, 	// choose Vertex Shader attribute to fill with data
  		4, 						// how many values? 1,2,3 or 4.  (we're using x,y,z,w)
  		gl.FLOAT, 		// data type for each value: usually gl.FLOAT
  		false, 				// did we supply fixed-point data AND it needs normalizing?
  		FSIZE * 7, 		// Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  		0);						// Offset -- now many bytes from START of buffer to the
  									// value we will actually use?
  gl.enableVertexAttribArray(a_Position);  
  									// Enable assignment of vertex buffer object's position data

  // Get graphics system's handle for our Vertex Shader's color-input variable;
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  // Use handle to specify how to retrieve color data from our VBO:
  gl.vertexAttribPointer(
  	a_Color, 				// choose Vertex Shader attribute to fill with data
  	3, 							// how many values? 1,2,3 or 4. (we're using R,G,B)
  	gl.FLOAT, 			// data type for each value: usually gl.FLOAT
  	false, 					// did we supply fixed-point data AND it needs normalizing?
  	FSIZE * 7, 			// Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  	FSIZE * 4);			// Offset -- how many bytes from START of buffer to the
  									// value we will actually use?  Need to skip over x,y,z,w
  									
  gl.enableVertexAttribArray(a_Color);  
  									// Enable assignment of vertex buffer object's position data

	//--------------------------------DONE!
  // Unbind the buffer object 
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return nn;
}

function draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix) {
//==============================================================================
  // Clear <canvas>  colors AND the depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //-------Draw Spinning Tetrahedron
  modelMatrix.setTranslate(xMdragTot,0, 0);  // 'set' means DISCARD old matrix,
  						// (drawing axes centered in CVV), and then make new
  						// drawing axes moved to the lower-left corner of CVV. 
  modelMatrix.scale(1,1,-1);							// convert to left-handed coord sys
  																				// to match WebGL display canvas.
  modelMatrix.scale(0.5, 0.5, 0.5);
  						// if you DON'T scale, tetra goes outside the CVV; clipped!
  modelMatrix.rotate(90, 0, 1, 0);  // Make new drawing axes that
 //modelMatrix.rotate(20.0, 0,1,0);
  						// that spin around y axis (0,1,0) of the previous 
  						// drawing axes, using the same origin.

  // DRAW TETRA:  Use this matrix to transform & draw 
  //						the first set of vertices stored in our VBO:
  		// Pass our current matrix to the vertex shaders:
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  		// Draw just the first set of vertices: start at vertex 0...
  //gl.drawArrays(gl.TRIANGLES, 0, 12);
  
  // NEXT, create different drawing axes, and...
  modelMatrix.translate(0, translate, 0.0);  // 'set' means DISCARD old matrix,
  						// (drawing axes centered in CVV), and then make new
  						// drawing axes moved to the lower-left corner of CVV.
  modelMatrix.scale(1,1,-1);							// convert to left-handed coord sys
  																				// to match WebGL display canvas.
  modelMatrix.scale(0.3, 0.3, 0.3);
  						// Make it smaller:
  modelMatrix.rotate(currentAngle, 0, 1, 0);  // Spin on XY diagonal axis
	// DRAW CUBE:		Use ths matrix to transform & draw
	//						the second set of vertices stored in our VBO:
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  		// Draw just the first set of vertices: start at vertex SHAPE_0_SIZE
  gl.drawArrays(gl.TRIANGLES, 12,36);

  modelMatrix.translate( 0, 2, 0);  
  //modelMatrix.scale(.15,.15,.15); 
  //modelMatrix.rotate(currentAngle, 0, 1, 0);
  // Drawing:
  // Pass our current matrix to the vertex shaders:
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  //gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 48, 18);


  modelMatrix.translate( 0, -5, 0);  
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 66, 24)

  modelMatrix.translate(0, 2, 0);

  modelMatrix.scale(.3,.3,.3);
  modelMatrix.rotate(currentAngle, 1, 0, 0);

  if (currentAngle > 180) {
    rotateAngle = 360 - currentAngle;
  } else {
    rotateAngle = currentAngle;
  }

  //modelMatrix.translate((rotateAngle/90)*8, 0, (rotateAngle/90)*8);
  modelMatrix.translate(4, 4, 0);
  modelMatrix.translate(-3, (1 - Math.cos(rotateAngle/90))* 10, (1 - Math.cos(rotateAngle/90)) * 10);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 12, 36);


  modelMatrix.scale(.5, .5, .5);
  modelMatrix.rotate(currentAngle, 0, 1, 0);
  //modelMatrix.translate(.5, .5, .);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 12, 36);


 // gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
 // gl.drawArrays(gl.TRIANGLES, 90, 10)


}

// Last time that this function was called:  (used for animation timing)
var g_last = Date.now();

function animate(angle) {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  
  // Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +20 and -85 degrees:
//  if(angle >  120.0 && ANGLE_STEP > 0) ANGLE_STEP = -ANGLE_STEP;
//  if(angle < -120.0 && ANGLE_STEP < 0) ANGLE_STEP = -ANGLE_STEP;

  if(press) {
    translate += .01;
  }
  if(translate > 0 && !press) {
    translate -= .01;
  }

  if (translate <= 0) {
    document.getElementById('Result').innerHTML = 'You are back on earth!';
    var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
    //return angle;
    
  }
  
  if (translate < .2 && translate >= .1) {
    var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  } else if(translate < .1){
    var newAngle = angle + ((ANGLE_STEP + 35) * elapsed) / 1000.0;
  } else if (translate >= .2 && translate < .4){
    var newAngle = angle + ((ANGLE_STEP + 60) * elapsed) / 1000.0;
  } else if (translate >= .4 && translate < .5){
    var newAngle = angle + ((ANGLE_STEP + 100    ) * elapsed) / 1000.0;
  } else {
    var newAngle = angle + ((ANGLE_STEP + 250) * elapsed) / 1000.0;
  }
  return newAngle %= 360;
}

//==================HTML Button Callbacks
function spinUp() {
  ANGLE_STEP += 25; 
}

function spinDown() {
 ANGLE_STEP -= 25; 
}

function runStop() {
  if(ANGLE_STEP*ANGLE_STEP > 1) {
    myTmp = ANGLE_STEP;
    ANGLE_STEP = 0;
  }
  else {
  	ANGLE_STEP = myTmp;
  }
}



function myKeyDown(ev) {
//===============================================================================
// Called when user presses down ANY key on the keyboard, and captures the 
// keyboard's scancode or keycode(varies for different countries and alphabets).
//  CAUTION: You may wish to avoid 'keydown' and 'keyup' events: if you DON'T 
// need to sense non-ASCII keys (arrow keys, function keys, pgUp, pgDn, Ins, 
// Del, etc), then just use the 'keypress' event instead.
//   The 'keypress' event captures the combined effects of alphanumeric keys and // the SHIFT, ALT, and CTRL modifiers.  It translates pressed keys into ordinary
// ASCII codes; you'll get the ASCII code for uppercase 'S' if you hold shift 
// and press the 's' key.
// For a light, easy explanation of keyboard events in JavaScript,
// see:    http://www.kirupa.com/html5/keyboard_events_in_javascript.htm
// For a thorough explanation of the messy way JavaScript handles keyboard events
// see:    http://javascript.info/tutorial/keyboard-events
//

  switch(ev.keyCode) {      // keycodes !=ASCII, but are very consistent for 
  //  nearly all non-alphanumeric keys for nearly all keyboards in all countries.
    case 32:    // space bar
      console.log(' space.');
      document.getElementById('Result').innerHTML =
        'You\'re blasting off!!!';
      press = true;
      break;
    default:
      console.log('myKeyDown()--keycode=', ev.keyCode, ', charCode=', ev.charCode);
      //document.getElementById('Result').innerHTML =
        //'myKeyDown()--keyCode='+ev.keyCode;
      break;
  }
}

function myKeyUp(ev) {
//===============================================================================
// Called when user releases ANY key on the keyboard; captures scancodes well

  console.log('myKeyUp()--keyCode='+ev.keyCode+' released.');
  switch(ev.keyCode) {      // keycodes !=ASCII, but are very consistent for 
  //  nearly all non-alphanumeric keys for nearly all keyboards in all countries.

    case 32:    // space bar
      console.log(' space.');
      document.getElementById('Result').innerHTML =
        'You are returning to earth';
        press = false;
      break;
    default:
      console.log('myKeyDown()--keycode=', ev.keyCode, ', charCode=', ev.charCode);
      //document.getElementById('Result').innerHTML =
      //  'myKeyDown()--keyCode='+ev.keyCode;
      break;
  }
}

function myKeyPress(ev) {
//===============================================================================
// Best for capturing alphanumeric keys and key-combinations such as 
// CTRL-C, alt-F, SHIFT-4, etc.
  console.log('myKeyPress():keyCode='+ev.keyCode  +', charCode=' +ev.charCode+
                        ', shift='    +ev.shiftKey + ', ctrl='    +ev.ctrlKey +
                        ', altKey='   +ev.altKey   +
                        ', metaKey(Command key or Windows key)='+ev.metaKey);
}

function myMouseDown(ev, gl, canvas) {
//==============================================================================
// Called when user PRESSES down any mouse button;
//                  (Which button?    console.log('ev.button='+ev.button);   )
//    ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//    pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
  
  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
               (canvas.width/2);      // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
               (canvas.height/2);
//  console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
  
  isDrag = true;                      // set our mouse-dragging flag
  xMclik = x;                         // record where mouse-dragging began
  yMclik = y;
};


function myMouseMove(ev, gl, canvas) {
//==============================================================================
// Called when user MOVES the mouse with a button already pressed down.
//                  (Which button?   console.log('ev.button='+ev.button);    )
//    ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//    pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

  if(isDrag==false) return;       // IGNORE all mouse-moves except 'dragging'

  // Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
  
  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
               (canvas.width/2);      // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
               (canvas.height/2);
//  console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);

  // find how far we dragged the mouse:
  xMdragTot += (x - xMclik);          // Accumulate change-in-mouse-position,&
  yMdragTot += (y - yMclik);
  xMclik = x;                         // Make next drag-measurement from here.
  yMclik = y;
};

function myMouseUp(ev, gl, canvas) {
//==============================================================================
// Called when user RELEASES mouse button pressed previously.
//                  (Which button?   console.log('ev.button='+ev.button);    )
//    ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//    pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);
  
  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
               (canvas.width/2);      // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
               (canvas.height/2);
  console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);
  
  isDrag = false;                     // CLEAR our mouse-dragging flag, and
  // accumulate any final bit of mouse-dragging we did:
  xMdragTot += (x - xMclik);
  yMdragTot += (y - yMclik);
  console.log('myMouseUp: xMdragTot,yMdragTot =',xMdragTot,',\t',yMdragTot);
};

   
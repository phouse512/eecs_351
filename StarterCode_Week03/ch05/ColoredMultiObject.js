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

  makeTorus();				 

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
  var nn = 102 + (torVerts.length/7);		// 12 tetrahedron vertices; 36 cube verts (6 per side*6 sides); 18 vertices
	console.log(torVerts.length/7);
  i = 102*7;
  console.log(colorShapes);
  //for(j=0; j< torVerts.length; i++, j++) {
    //console.log(colorShapes[i]);
    //console.log(torVerts[j]);
 //   colorShapes[i] = torVerts[j];
  //}

  console.log(colorShapes);
  console.log(colorShapes.length);


	
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
  modelMatrix.setTranslate(0,0, 0);  // 'set' means DISCARD old matrix,
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
  modelMatrix.translate(0.4, translate, 0.0);  // 'set' means DISCARD old matrix,
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

function makeTorus() {
  //==============================================================================
  //    Create a torus centered at the origin that circles the z axis.  
  // Terminology: imagine a torus as a flexible, cylinder-shaped bar or rod bent 
  // into a circle around the z-axis. The bent bar's centerline forms a circle
  // entirely in the z=0 plane, centered at the origin, with radius 'rbend'.  The 
  // bent-bar circle begins at (rbend,0,0), increases in +y direction to circle  
  // around the z-axis in counter-clockwise (CCW) direction, consistent with our
  // right-handed coordinate system.
  //    This bent bar forms a torus because the bar itself has a circular cross-
  // section with radius 'rbar' and angle 'phi'. We measure phi in CCW direction 
  // around the bar's centerline, circling right-handed along the direction 
  // forward from the bar's start at theta=0 towards its end at theta=2PI.
  //    THUS theta=0, phi=0 selects the torus surface point (rbend+rbar,0,0);
  // a slight increase in phi moves that point in -z direction and a slight
  // increase in theta moves that point in the +y direction.  
  // To construct the torus, begin with the circle at the start of the bar:
  //          xc = rbend + rbar*cos(phi); 
  //          yc = 0; 
  //          zc = -rbar*sin(phi);      (note negative sin(); right-handed phi)
  // and then rotate this circle around the z-axis by angle theta:
  //          x = xc*cos(theta) - yc*sin(theta)   
  //          y = xc*sin(theta) + yc*cos(theta)
  //          z = zc
  // Simplify: yc==0, so
  //          x = (rbend + rbar*cos(phi))*cos(theta)
  //          y = (rbend + rbar*cos(phi))*sin(theta) 
  //          z = -rbar*sin(phi)
  // To construct a torus from a single triangle-strip, make a 'stepped spiral' along the length of the bent bar; successive rings of constant-theta, using the same design used for cylinder walls in 'makeCyl()' and for 'slices' in makeSphere().  Unlike the cylinder and sphere, we have no 'special case' for the first and last of these bar-encircling rings.
  //
  var rbend = 1.0;                    // Radius of circle formed by torus' bent bar
  var rbar = 0.5;                     // radius of the bar we bent to form torus
  var barSlices = 75;                 // # of bar-segments in the torus: >=3 req'd;
                                      // more segments for more-circular torus
  var barSides = 13;                    // # of sides of the bar (and thus the 
                                      // number of vertices in its cross-section)
                                      // >=3 req'd;
                                      // more sides for more-circular cross-section
  // for nice-looking torus with approx square facets, 
  //      --choose odd or prime#  for barSides, and
  //      --choose pdd or prime# for barSlices of approx. barSides *(rbend/rbar)
  // EXAMPLE: rbend = 1, rbar = 0.5, barSlices =23, barSides = 11.

    // Create a (global) array to hold this torus's vertices:
   torVerts = new Float32Array(floatsPerVertex*(2*barSides*barSlices +2));
  //  Each slice requires 2*barSides vertices, but 1st slice will skip its first 
  // triangle and last slice will skip its last triangle. To 'close' the torus,
  // repeat the first 2 vertices at the end of the triangle-strip.  Assume 7

  var phi=0, theta=0;                   // begin torus at angles 0,0
  var thetaStep = 2*Math.PI/barSlices;  // theta angle between each bar segment
  var phiHalfStep = Math.PI/barSides;   // half-phi angle between each side of bar
                                        // (WHY HALF? 2 vertices per step in phi)
    // s counts slices of the bar; v counts vertices within one slice; j counts
    // array elements (Float32) (vertices*#attribs/vertex) put in torVerts array.
    for(s=0,j=0; s<barSlices; s++) {    // for each 'slice' or 'ring' of the torus:
      for(v=0; v< 2*barSides; v++, j+=7) {    // for each vertex in this slice:
        if(v%2==0)  { // even #'d vertices at bottom of slice,
          torVerts[j  ] = (rbend + rbar*Math.cos((v)*phiHalfStep)) * 
                                               Math.cos((s)*thetaStep);
                  //  x = (rbend + rbar*cos(phi)) * cos(theta)
          torVerts[j+1] = (rbend + rbar*Math.cos((v)*phiHalfStep)) *
                                               Math.sin((s)*thetaStep);
                  //  y = (rbend + rbar*cos(phi)) * sin(theta) 
          torVerts[j+2] = -rbar*Math.sin((v)*phiHalfStep);
                  //  z = -rbar  *   sin(phi)
          torVerts[j+3] = 1.0;    // w
        }
        else {        // odd #'d vertices at top of slice (s+1);
                      // at same phi used at bottom of slice (v-1)
          torVerts[j  ] = (rbend + rbar*Math.cos((v-1)*phiHalfStep)) * 
                                               Math.cos((s+1)*thetaStep);
                  //  x = (rbend + rbar*cos(phi)) * cos(theta)
          torVerts[j+1] = (rbend + rbar*Math.cos((v-1)*phiHalfStep)) *
                                               Math.sin((s+1)*thetaStep);
                  //  y = (rbend + rbar*cos(phi)) * sin(theta) 
          torVerts[j+2] = -rbar*Math.sin((v-1)*phiHalfStep);
                  //  z = -rbar  *   sin(phi)
          torVerts[j+3] = 1.0;    // w
        }
        torVerts[j+4] = Math.random();    // random color 0.0 <= R < 1.0
        torVerts[j+5] = Math.random();    // random color 0.0 <= G < 1.0
        torVerts[j+6] = Math.random();    // random color 0.0 <= B < 1.0
      }
    }
    // Repeat the 1st 2 vertices of the triangle strip to complete the torus:
        torVerts[j  ] = rbend + rbar; // copy vertex zero;
                //  x = (rbend + rbar*cos(phi==0)) * cos(theta==0)
        torVerts[j+1] = 0.0;
                //  y = (rbend + rbar*cos(phi==0)) * sin(theta==0) 
        torVerts[j+2] = 0.0;
                //  z = -rbar  *   sin(phi==0)
        torVerts[j+3] = 1.0;    // w
        torVerts[j+4] = Math.random();    // random color 0.0 <= R < 1.0
        torVerts[j+5] = Math.random();    // random color 0.0 <= G < 1.0
        torVerts[j+6] = Math.random();    // random color 0.0 <= B < 1.0
        j+=7; // go to next vertex:
        torVerts[j  ] = (rbend + rbar) * Math.cos(thetaStep);
                //  x = (rbend + rbar*cos(phi==0)) * cos(theta==thetaStep)
        torVerts[j+1] = (rbend + rbar) * Math.sin(thetaStep);
                //  y = (rbend + rbar*cos(phi==0)) * sin(theta==thetaStep) 
        torVerts[j+2] = 0.0;
                //  z = -rbar  *   sin(phi==0)
        torVerts[j+3] = 1.0;    // w
        torVerts[j+4] = Math.random();    // random color 0.0 <= R < 1.0
        torVerts[j+5] = Math.random();    // random color 0.0 <= G < 1.0
        torVerts[j+6] = Math.random();    // random color 0.0 <= B < 1.0
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

   
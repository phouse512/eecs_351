//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
//==============================================================================
//
// LookAtTrianglesWithKey_ViewVolume.js (c) 2012 matsuda
//
//  MODIFIED 2014.02.19 J. Tumblin to 
//		--demonstrate multiple viewports (see 'draw()' function at bottom of file)
//		--draw ground plane in the 3D scene:  makeGroundPlane()

// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * a_Position;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';
  
var floatsPerVertex = 6;	// # of Float32Array elements used for each vertex							// (x,y,z)position + (r,g,b)colo



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

	// NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
	// unless the new Z value is closer to the eye than the old one..
//	gl.depthFunc(gl.LESS);			 // WebGL default setting: (default)
	gl.enable(gl.DEPTH_TEST); 
	
  // Set the vertex coordinates and color (the blue triangle is in the front)
  var n = initVertexBuffers(gl);

  if (n < 0) {
    console.log('Failed to specify the vertex infromation');
    return;
  }

  // Specify the color for clearing <canvas>
  gl.clearColor(0.2, 0.2, 0.2, 1.0);

  // Get the storage locations of u_ViewMatrix and u_ProjMatrix variables
  var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  if (!u_ViewMatrix || !u_ProjMatrix) { 
    console.log('Failed to get u_ViewMatrix or u_ProjMatrix');
    return;
  }


  // Create the matrix to specify the view matrix
  var viewMatrix = new Matrix4();
  var projMatrix = new Matrix4();
  var currentAngle = 45.0;
  // Register the event handler to be called on key press
  document.onkeydown = function(ev){ keydown(ev, gl,currentAngle, u_ViewMatrix, viewMatrix, u_ProjMatrix, projMatrix); };
	// (Note that I eliminated the 'n' argument (no longer needed)).
	
  // Create the matrix to specify the viewing volume and pass it to u_ProjMatrix

  // REPLACE this orthographic camera matrix:
/*  projMatrix.setOrtho(-1.0, 1.0, 					// left,right;
  										-1.0, 1.0, 					// bottom, top;
  										0.0, 2000.0);				// near, far; (always >=0)
*/
	// with this perspective-camera matrix:
	// (SEE PerspectiveView.js, Chapter 7 of book)

  var canvasWidth = canvas.width;
  var canvasHeight = canvas.height;

  // YOU TRY IT: make an equivalent camera using matrix-cuon-mod.js
  // perspective-camera matrix made by 'frustum()' function..
  
	// Send this matrix to our Vertex and Fragment shaders through the
	// 'uniform' variable u_ProjMatrix:
  var tick = function() {
    currentAngle = animate(currentAngle);  // Update the rotation angle
    draw(gl, currentAngle, u_ViewMatrix, viewMatrix, u_ProjMatrix, projMatrix);   // Draw shapes
    //console.log('currentAngle=',currentAngle);
    requestAnimationFrame(tick, canvas);   
                      // Request that the browser re-draw the webpage
  };
  tick();   

}

function makeSphere() {
//==============================================================================
// Make a sphere from one OpenGL TRIANGLE_STRIP primitive.   Make ring-like 
// equal-lattitude 'slices' of the sphere (bounded by planes of constant z), 
// and connect them as a 'stepped spiral' design (see makeCylinder) to build the
// sphere from one triangle strip.
  var slices = 10;    // # of slices of the sphere along the z axis. >=3 req'd
                      // (choose odd # or prime# to avoid accidental symmetry)
  var sliceVerts  = 10; // # of vertices around the top edge of the slice
                      // (same number of vertices on bottom of slice, too)
  var topColr = new Float32Array([0.7, 0.7, 0.7]);  // North Pole: light gray
  var equColr = new Float32Array([0.3, 0.7, 0.3]);  // Equator:    bright green
  var botColr = new Float32Array([0.9, 0.9, 0.9]);  // South Pole: brightest gray.
  var sliceAngle = Math.PI/slices;  // lattitude angle spanned by one slice.

  // Create a (global) array to hold this sphere's vertices:
  sphVerts = new Float32Array(  ((slices * 2* sliceVerts) -2) * floatsPerVertex);
                    // # of vertices * # of elements needed to store them. 
                    // each slice requires 2*sliceVerts vertices except 1st and
                    // last ones, which require only 2*sliceVerts-1.
                    
  // Create dome-shaped top slice of sphere at z=+1
  // s counts slices; v counts vertices; 
  // j counts array elements (vertices * elements per vertex)
  var cos0 = 0.0;         // sines,cosines of slice's top, bottom edge.
  var sin0 = 0.0;
  var cos1 = 0.0;
  var sin1 = 0.0; 
  var j = 0;              // initialize our array index
  var isLast = 0;
  var isFirst = 1;
  for(s=0; s<slices; s++) { // for each slice of the sphere,
    // find sines & cosines for top and bottom of this slice
    if(s==0) {
      isFirst = 1;  // skip 1st vertex of 1st slice.
      cos0 = 1.0;   // initialize: start at north pole.
      sin0 = 0.0;
    }
    else {          // otherwise, new top edge == old bottom edge
      isFirst = 0;  
      cos0 = cos1;
      sin0 = sin1;
    }               // & compute sine,cosine for new bottom edge.
    cos1 = Math.cos((s+1)*sliceAngle);
    sin1 = Math.sin((s+1)*sliceAngle);
    // go around the entire slice, generating TRIANGLE_STRIP verts
    // (Note we don't initialize j; grows with each new attrib,vertex, and slice)
    if(s==slices-1) isLast=1; // skip last vertex of last slice.
    for(v=isFirst; v< 2*sliceVerts-isLast; v++, j+=floatsPerVertex) { 
      if(v%2==0)
      {       // put even# vertices at the the slice's top edge
              // (why PI and not 2*PI? because 0 <= v < 2*sliceVerts
              // and thus we can simplify cos(2*PI(v/2*sliceVerts))  
        sphVerts[j  ] = sin0 * Math.cos(Math.PI*(v)/sliceVerts);  
        sphVerts[j+1] = sin0 * Math.sin(Math.PI*(v)/sliceVerts);  
        sphVerts[j+2] = cos0;       
      }
      else {  // put odd# vertices around the slice's lower edge;
              // x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
              //          theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
        sphVerts[j  ] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);    // x
        sphVerts[j+1] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);    // y
        sphVerts[j+2] = cos1;                                       // z                                    // w.   
      }
      if(s==0) {  // finally, set some interesting colors for vertices:
        sphVerts[j+3]=topColr[0]; 
        sphVerts[j+4]=topColr[1]; 
        sphVerts[j+5]=topColr[2]; 
        }
      else if(s==slices-1) {
        sphVerts[j+3]=botColr[0]; 
        sphVerts[j+4]=botColr[1]; 
        sphVerts[j+5]=botColr[2]; 
      }
      else {
          sphVerts[j+3]=Math.random();// equColr[0]; 
          sphVerts[j+4]=Math.random();// equColr[1]; 
          sphVerts[j+5]=Math.random();// equColr[2];          
      }
    }
  }

  console.log(sphVerts);
}

function makeGroundGrid() {
//==============================================================================
// Create a list of vertices that create a large grid of lines in the x,y plane
// centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

	var xcount = 100;			// # of lines to draw in x,y to make the grid.
	var ycount = 100;		
	var xymax	= 50.0;			// grid size; extends to cover +/-xymax in x and y.
 	var xColr = new Float32Array([1.0, 1.0, 0.3]);	// bright yellow
 	var yColr = new Float32Array([0.5, 1.0, 0.5]);	// bright green.
 	
	// Create an (global) array to hold this ground-plane's vertices:
	gndVerts = new Float32Array(floatsPerVertex*2*(xcount+ycount));
						// draw a grid made of xcount+ycount lines; 2 vertices per line.
						
	var xgap = xymax/(xcount-1);		// HALF-spacing between lines in x,y;
	var ygap = xymax/(ycount-1);		// (why half? because v==(0line number/2))
	
	// First, step thru x values as we make vertical lines of constant-x:
	for(v=0, j=0; v<2*xcount; v++, j+= floatsPerVertex) {
		if(v%2==0) {	// put even-numbered vertices at (xnow, -xymax, 0)
			gndVerts[j  ] = -xymax + (v  )*xgap;	// x
			gndVerts[j+1] = -xymax;								// y
			gndVerts[j+2] = 0.0;									// z
		}
		else {				// put odd-numbered vertices at (xnow, +xymax, 0).
			gndVerts[j  ] = -xymax + (v-1)*xgap;	// x
			gndVerts[j+1] = xymax;								// y
			gndVerts[j+2] = 0.0;									// z
		}
		gndVerts[j+3] = xColr[0];			// red
		gndVerts[j+4] = xColr[1];			// grn
		gndVerts[j+5] = xColr[2];			// blu
	}
	// Second, step thru y values as wqe make horizontal lines of constant-y:
	// (don't re-initialize j--we're adding more vertices to the array)
	for(v=0; v<2*ycount; v++, j+= floatsPerVertex) {
		if(v%2==0) {		// put even-numbered vertices at (-xymax, ynow, 0)
			gndVerts[j  ] = -xymax;								// x
			gndVerts[j+1] = -xymax + (v  )*ygap;	// y
			gndVerts[j+2] = 0.0;									// z
		}
		else {					// put odd-numbered vertices at (+xymax, ynow, 0).
			gndVerts[j  ] = xymax;								// x
			gndVerts[j+1] = -xymax + (v-1)*ygap;	// y
			gndVerts[j+2] = 0.0;									// z
		}
		gndVerts[j+3] = yColr[0];			// red
		gndVerts[j+4] = yColr[1];			// grn
		gndVerts[j+5] = yColr[2];			// blu
	}
}

function initVertexBuffers(gl) {
//==============================================================================

	// make our 'forest' of triangular-shaped trees:
  forestVerts = new Float32Array([
    // Vertex coordinates and color
     0.0,  0.5,  -0.4,  0.4,  1.0,  0.4, // The back green one
    -0.5, -0.5,  -0.4,  0.4,  1.0,  0.4,
     0.5, -0.5,  -0.4,  1.0,  0.4,  0.4, 
   
     0.5,  0.4,  -0.2,  1.0,  0.4,  0.4, // The middle yellow one
    -0.5,  0.4,  -0.2,  1.0,  1.0,  0.4,
     0.0, -0.6,  -0.2,  1.0,  1.0,  0.4, 

     0.0,  0.5,   0.0,  0.4,  0.4,  1.0,  // The front blue one 
    -0.5, -0.5,   0.0,  0.4,  0.4,  1.0,
     0.5, -0.5,   0.0,  1.0,  0.4,  0.4, 
  ]);

  lineVerts = new Float32Array([
     0.0,  -100.0, 0.0, 0, 1, 0,
     0.0, 100.0, 0.0, 0, 1, 0,
     -100.0,  0.0, 0.0, 1, 0, 0,
     100.0, 0,  0,   1, 0, 0,
     0, 0, -100.0, 0, 0, 1,
     0, 0, 100.0, 0, 0, 1
  ]);

  rectangleVerts = new Float32Array([
     1.0, -2.0, -1.0,    0.0, 1.0, 0.0,  // Node 3
     1.0,  2.0, -1.0,    1.0, 0.0, 0.0,  // Node 2
     1.0,  2.0,  1.0,    1.0, 0.0, 0.0,  // Node 4
     
     1.0,  2.0,  1.0,    1.0, 0.1, 0.1,  // Node 4
     1.0, -2.0,  1.0,    1.0, 0.1, 0.1,  // Node 7
     1.0, -2.0, -1.0,    1.0, 0.1, 0.1,  // Node 3

    // +y face: GREEN
    -1.0,  2.0, -1.0,    0.0, 1.0, 0.0,  // Node 1
    -1.0,  2.0,  1.0,    0.0, 1.0, 0.0,  // Node 5
     1.0,  2.0,  1.0,    0.0, 1.0, 0.0,  // Node 4

     1.0,  2.0,  1.0,    0.1, 1.0, 0.1,  // Node 4
     1.0,  2.0, -1.0,    0.1, 1.0, 0.1,  // Node 2 
    -1.0,  2.0, -1.0,    0.1, 1.0, 0.1,  // Node 1

    // +z face: BLUE
    -1.0,  2.0,  1.0,    0.4, 0.3, 1.0,  // Node 5
    -1.0, -2.0,  1.0,    0.4, 0.2, 1.0,  // Node 6
     1.0, -2.0,  1.0,    0.2, 0.1, 1.0,  // Node 7

     1.0, -2.0,  1.0,    0.4, 0.1, 1.0,  // Node 7
     1.0,  2.0,  1.0,    0.6, 0.1, 1.0,  // Node 4
    -1.0,  2.0,  1.0,    0.8, 0.1, 1.0,  // Node 5

    // -x face: CYAN
    -1.0, -2.0,  1.0,    0.0, 1.0, 1.0,  // Node 6 
    -1.0,  2.0,  1.0,    0.0, 1.0, 1.0,  // Node 5 
    -1.0,  2.0, -1.0,    0.0, 1.0, 1.0,  // Node 1
    
    -1.0,  2.0, -1.0,    0.1, 1.0, 1.0,  // Node 1
    -1.0, -2.0, -1.0,    0.1, 1.0, 1.0,  // Node 0  
    -1.0, -2.0,  1.0,    0.1, 1.0, 1.0,  // Node 6  
    
    // -y face: MAGENTA
     1.0, -2.0, -1.0,    1.0, 0.0, 1.0,  // Node 3
     1.0, -2.0,  1.0,    1.0, 0.0, 1.0,  // Node 7
    -1.0, -2.0,  1.0,    1.0, 0.0, 1.0,  // Node 6

    -1.0, -2.0,  1.0,    1.0, 0.1, 1.0,  // Node 6
    -1.0, -2.0, -1.0,    1.0, 0.1, 1.0,  // Node 0
     1.0, -2.0, -1.0,    1.0, 0.1, 1.0,  // Node 3

     // -z face: YELLOW
     1.0,  2.0, -1.0,    1.0, 1.0, 0.0,  // Node 2
     1.0, -2.0, -1.0,    1.0, 1.0, 0.0,  // Node 3
    -1.0, -2.0, -1.0,    1.0, 1.0, 0.0,  // Node 0   

    -1.0, -2.0, -1.0,    1.0, 1.0, 0.1,  // Node 0
    -1.0,  2.0, -1.0,    1.0, 1.0, 0.1,  // Node 1
     1.0,  2.0, -1.0,    1.0, 1.0, 0.1,  // Node 2
  ]);

squareVerts = new Float32Array([
     1.0, -1.0, -1.0,    0.0, 1.0, 0.0,  // Node 3
     1.0,  1.0, -1.0,    1.0, 0.0, 0.0,  // Node 2
     1.0,  1.0,  1.0,    1.0, 0.0, 0.0,  // Node 4
     
     1.0,  1.0,  1.0,    1.0, 0.1, 0.1,  // Node 4
     1.0, -1.0,  1.0,    1.0, 0.1, 0.1,  // Node 7
     1.0, -1.0, -1.0,    1.0, 0.1, 0.1,  // Node 3

    // +y face: GREEN
    -1.0,  1.0, -1.0,    0.0, 1.0, 0.0,  // Node 1
    -1.0,  1.0,  1.0,    0.0, 1.0, 0.0,  // Node 5
     1.0,  1.0,  1.0,    0.0, 1.0, 0.0,  // Node 4

     1.0,  1.0,  1.0,    0.1, 1.0, 0.1,  // Node 4
     1.0,  1.0, -1.0,    0.1, 1.0, 0.1,  // Node 2 
    -1.0,  1.0, -1.0,    0.1, 1.0, 0.1,  // Node 1

    // +z face: BLUE
    -1.0,  1.0,  1.0,    0.4, 0.3, 1.0,  // Node 5
    -1.0, -1.0,  1.0,    0.4, 0.2, 1.0,  // Node 6
     1.0, -1.0,  1.0,    0.2, 0.1, 1.0,  // Node 7

     1.0, -1.0,  1.0,    0.4, 0.1, 1.0,  // Node 7
     1.0,  1.0,  1.0,    0.6, 0.1, 1.0,  // Node 4
    -1.0,  1.0,  1.0,    0.8, 0.1, 1.0,  // Node 5

    // -x face: CYAN
    -1.0, -1.0,  1.0,    0.0, 1.0, 1.0,  // Node 6 
    -1.0,  1.0,  1.0,    0.0, 1.0, 1.0,  // Node 5 
    -1.0,  1.0, -1.0,    0.0, 1.0, 1.0,  // Node 1
    
    -1.0,  1.0, -1.0,    0.1, 1.0, 1.0,  // Node 1
    -1.0, -1.0, -1.0,    0.1, 1.0, 1.0,  // Node 0  
    -1.0, -1.0,  1.0,    0.1, 1.0, 1.0,  // Node 6  
    
    // -y face: MAGENTA
     1.0, -1.0, -1.0,    1.0, 0.0, 1.0,  // Node 3
     1.0, -1.0,  1.0,    1.0, 0.0, 1.0,  // Node 7
    -1.0, -1.0,  1.0,    1.0, 0.0, 1.0,  // Node 6

    -1.0, -1.0,  1.0,    1.0, 0.1, 1.0,  // Node 6
    -1.0, -1.0, -1.0,    1.0, 0.1, 1.0,  // Node 0
     1.0, -1.0, -1.0,    1.0, 0.1, 1.0,  // Node 3

     // -z face: YELLOW
     1.0,  1.0, -1.0,    1.0, 1.0, 0.0,  // Node 2
     1.0, -1.0, -1.0,    1.0, 1.0, 0.0,  // Node 3
    -1.0, -1.0, -1.0,    1.0, 1.0, 0.0,  // Node 0   

    -1.0, -1.0, -1.0,    1.0, 1.0, 0.1,  // Node 0
    -1.0,  1.0, -1.0,    1.0, 1.0, 0.1,  // Node 1
     1.0,  1.0, -1.0,    1.0, 1.0, 0.1,  // Node 2
  ]);

  rocketVerts = new Float32Array([
      1, 0,  1,      1.0, .1, 0.0, // node 0
      1, 0,  1,      1.0, .1, 0.0, // node 1
      0, 1,  0,      .5, .1, 0.0, // node 4

      1, 0,  1,      1.0, .9, 0.0, // node 1
      1, 0, -1,      1.0, .9, 0.0, // node 2
      0, 1,  0,      1.0, .9, 0.0, // node 4

      1, 0, -1,      .1, .5, 0.0, // node 2
     -1, 0, -1,      .1, .5, 0.0, // node 3
      0, 1,  0,      .1, .5, 0.0, // node 4

     -1, 0,  1,      .8, 1.0, 0.0, // node 0
     -1, 0, -1,      .8, .5, 0.0, // node 3
      0, 1,  0,      .8, .2, 0.0, // node 4

     -1, 0,  1,      .4, 0.2, 0.1, // node 0
      1, 0,  1,      .4, 1.0, 0.1, // node 1
     -1, 0, -1,      .4, .9, 0.1, // node 3

      1, 0,  1,      .4, 1.0,  0.1, // node 1
     -1, 0, -1,      .4, 1.0, 0.1, // node 3
      1, 0, -1,      .4, 1.0, 0.1, // node 2
  ]);
      // half pyramid

     // -1,  1,  1, 1, -- node 0
     // -2, -2,  2, 1, -- node 1
     //  2, -2,  2, 1, -- node 2
     //  1,  1,  1, 1, -- node 3
     // 1,  1, -1, 1, -- node 4
     //  2, -2, -2, 1, -- node 5
     // -2, -2, -2, 1, -- node 6
     // -1,  1, -1, 1, -- node 7
  halfPyramidVerts = new Float32Array([
      // facing me
      -1,  1,  1,      1.0, .1, 0.0, // node 0
      -2, -2,  2,      1.0, .1, 0.0, // node 1
       1,  1,  1,       .5, .1, 0.0, // node 3

      -2, -2,  2,      1.0, .9, 0.0, // node 1
       2, -2,  2,      1.0, .9, 0.0, // node 2
       1,  1,  1,       .5, .9, 0.0, // node 3

       // right side face
       2, -2,  2,      .4,  1.0,  0.1, // node 2
       1,  1,  1,      .4, 1.0, 0.1, // node 3
       1,  1, -1,      .4, 1.0, 0.1, // node 4

       2, -2,  2,      .4,  1.0,  0.1, // node 2
       1,  1, -1,      .4, 1.0, 0.1, // node 4
       2, -2, -2,      .4, 1.0, 0.1, // node 5

       // back face
       1,  1, -1,      .4, 0.2, 0.1, // node 4
      -2, -2, -2,      .4, 1.0, 0.1, // node 6
      -1,  1, -1,      .4, .9, 0.1, // node 7

       1,  1, -1,      .4, 0.2, 0.1, // node 4
       2, -2, -2,      .4, 1.0, 0.1, // node 5
      -2, -2, -2,      .4, .9, 0.1, // node 6

      // left face
      -1,  1,  1,      .8, 1.0, 0.0, // node 0
      -1,  1, -1,      .8, .5, 0.0, // node 7
      -2, -2, -2,      .8, .2, 0.0, // node 6

      -1,  1,  1,      .8, 1.0, 0.0, // node 0
      -2, -2,  2,      .8, .5, 0.0, // node 1
      -2, -2, -2,      .8, .2, 0.0, // node 6

      // bottom
      -2, -2,  2,      .8, 1.0, 0.0, // node 1
       2, -2,  2,      .8, .5, 0.0, // node 2
      -2, -2, -2,      .8, .2, 0.0, // node 6

       2, -2,  2,      .8, 1.0, 0.0, // node 2
       2, -2, -2,      .8, .5, 0.0, // node 5
      -2, -2, -2,      .8, .2, 0.0, // node 6
  ]);
  
  // Make our 'ground plane' and 'torus' shapes too:
  makeGroundGrid();
  makeSphere();

	// How much space to store all the shapes in one array?
	// (no 'var' means this is a global variable)
	mySiz = forestVerts.length + gndVerts.length + lineVerts.length + rectangleVerts.length + rocketVerts.length + halfPyramidVerts.length + sphVerts.length + squareVerts.length;

	// How many vertices total?
	var nn = mySiz / floatsPerVertex;
	console.log('nn is', nn, 'mySiz is', mySiz, 'floatsPerVertex is', floatsPerVertex);

	// Copy all shapes into one big Float32 array:
  var verticesColors = new Float32Array(mySiz);
	// Copy them:  remember where to start for each shape:
	forestStart = 0;							// we store the forest first.
  for(i=0,j=0; j< forestVerts.length; i++,j++) {
  	verticesColors[i] = forestVerts[j];
		} 
	gndStart = i;						// next we'll store the ground-plane;
	for(j=0; j< gndVerts.length; i++, j++) {
		verticesColors[i] = gndVerts[j];
		}
  linestart = i;
  for(j=0; j < lineVerts.length; i++,j++) {
    verticesColors[i] = lineVerts[j];
  }
  rectanglestart = i;
  for(j=0; j < rectangleVerts.length; i++,j++) {
    verticesColors[i] = rectangleVerts[j];
  }
  rocketstart = i;
  for(j=0; j < rocketVerts.length; i++,j++) {
    verticesColors[i] = rocketVerts[j];
  }
  halfpyramidstart = i;
  for(j=0; j < halfPyramidVerts.length; i++,j++) {
    verticesColors[i] = halfPyramidVerts[j];
  }
  spherestart = i;
  for(j=0; j < sphVerts.length; i++,j++) {
    verticesColors[i] = sphVerts[j];
  }
  squarestart = i;
  for(j=0; j < squareVerts.length; i++,j++) {
    verticesColors[i] = squareVerts[j];
  }
  console.log(linestart);
  // Create a buffer object
  var vertexColorbuffer = gl.createBuffer();  
  if (!vertexColorbuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Write vertex information to buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

  var FSIZE = verticesColors.BYTES_PER_ELEMENT;
  // Assign the buffer object to a_Position and enable the assignment
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
  gl.enableVertexAttribArray(a_Position);
  // Assign the buffer object to a_Color and enable the assignment
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
  gl.enableVertexAttribArray(a_Color);

  return mySiz/floatsPerVertex;	// return # of vertices
}

var g_EyeX = 0.20, g_EyeY = 0.25, g_EyeZ = 4.25; 
var g_LookAtX = .2, g_LookAtY = .25, g_LookAtZ = 0;
var g_near = 0.0, g_far = 100;
var g_left = -1, g_right = 1;
var g_top = -1, g_bottom = 1;
// Global vars for Eye position. 
// NOTE!  I moved eyepoint BACKWARDS from the forest: from g_EyeZ=0.25
// a distance far enough away to see the whole 'forest' of trees within the
// 30-degree field-of-view of our 'perspective' camera.  I ALSO increased
// the 'keydown()' function's effect on g_EyeX position.


function keydown(ev, gl, currentAngle, u_ViewMatrix, viewMatrix, u_ProjMatrix, projMatrix) {
//------------------------------------------------------
//HTML calls this'Event handler' or 'callback function' when we press a key:
    look_vectorX = g_LookAtX - g_EyeX;
    look_vectorY = g_LookAtY - g_EyeY;
    look_vectorZ = g_LookAtZ - g_EyeZ;

    vector_length = Math.abs(Math.sqrt(Math.pow(look_vectorX,2) + Math.pow(look_vectorZ,2) + Math.pow(look_vectorY,2)));
    unit_X = look_vectorX/vector_length;
    unit_Y = look_vectorY/vector_length;
    unit_Z = look_vectorZ/vector_length;

    move_distance = .5;

    if(ev.keyCode == 39) { // The right arrow key was pressed
				g_EyeX -= 0.2;		// INCREASED for perspective camera)
        g_LookAtX -= 0.2;
    } else 
    if (ev.keyCode == 37) { // The left arrow key was pressed
				g_EyeX += 0.2;		// INCREASED for perspective camera)
        g_LookAtX += 0.2;
    } else
    if (ev.keyCode == 82) {  // 'r' key has been pressed - move up
        g_EyeY += .2;
        g_LookAtY += .2;
    } else
    if (ev.keyCode == 70) { // 'f' key has been pressed - move down
      if (g_EyeY >= .2){
        g_EyeY -= .2;
        g_LookAtY -= 0.2;
      }
    } else
    if (ev.keyCode == 38) {
      g_EyeZ += unit_Z*move_distance;
      g_LookAtZ += unit_Z*move_distance;
      g_EyeX += unit_X*move_distance;
      g_LookAtX += unit_X*move_distance;
      g_EyeY += unit_Y*move_distance;
      g_LookAtY += unit_Y*move_distance;
      g_far -= .5;
      g_near -= .5;
      g_left += .1;
      g_right -= .1;
      g_top += .1;
      g_bottom -= .1;
    } else
    if (ev.keyCode == 40) {
      g_EyeZ -= unit_Z*move_distance;
      g_LookAtZ -= unit_Z*move_distance;
      g_EyeX -= unit_X*move_distance;
      g_LookAtX -= unit_X*move_distance;
      g_EyeY -= unit_Y*move_distance;
      g_LookAtY -= unit_Y*move_distance;
      g_far += .5;
      g_near += .5;
      g_left -= .1;
      g_right += .1;
      g_top -= .1;
      g_bottom += .1;
    } else
    if (ev.keyCode == 65) {
      // 'a' keypress, turn left
      //turn left 5 degrees
      degrees = 4;

      newVectorX = look_vectorX*Math.cos(toRadians(degrees)) - look_vectorZ*Math.sin(toRadians(degrees));
      newVectorZ = look_vectorX*Math.sin(toRadians(degrees)) + look_vectorZ*Math.cos(toRadians(degrees));

      g_LookAtX = newVectorX + g_EyeX;
      g_LookAtZ = newVectorZ + g_EyeZ;

    } else
    if (ev.keyCode == 68) {
      // 'd' keypress, look right
      //turn right -5
      degrees = -4;

      newVectorX = look_vectorX*Math.cos(toRadians(degrees)) - look_vectorZ*Math.sin(toRadians(degrees));
      newVectorZ = look_vectorX*Math.sin(toRadians(degrees)) + look_vectorZ*Math.cos(toRadians(degrees));

      g_LookAtX = newVectorX + g_EyeX;
      g_LookAtZ = newVectorZ + g_EyeZ;
    } else
    if (ev.keyCode == 87) {
      // 'w' keypress, look up action
      g_LookAtY += .2;
    } else 
    if (ev.keyCode == 83) {
      // 's' keypress, look down action
      g_LookAtY -= .2;
    } else { return; } // Prevent the unnecessary drawing
    draw(gl, currentAngle, u_ViewMatrix, viewMatrix, u_ProjMatrix, projMatrix);    
}


function toRadians (angle) {
  return angle * (Math.PI / 180);
}

function draw(gl, currentAngle, u_ViewMatrix, viewMatrix, u_ProjMatrix, projMatrix) {
  //==============================================================================
  //console.log("draw debug:\n currentAngle: " + currentAngle + "\n viewMatrix: " + viewMatrix);

  // Clear <canvas> color AND DEPTH buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Using OpenGL/ WebGL 'viewports':
  // these determine the mapping of CVV to the 'drawing context',
  // (for WebGL, the 'gl' context describes how we draw inside an HTML-5 canvas)
  // Details? see
  //
  //  https://www.khronos.org/registry/webgl/specs/1.0/#2.3
  // Draw in the FIRST of several 'viewports'
  //------------------------------------------
  // CHANGE from our default viewport:
  // gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  // to a smaller one:
  // gl.viewport(0,                             // Viewport lower-left corner
  //            0,                              // (x,y) location(in pixels)
 //             gl.drawingBufferWidth/2,        // viewport width, height.
 //             gl.drawingBufferHeight/2);
              
 //  // Set the matrix to be used for to set the camera view
 //  viewMatrix.setLookAt(g_EyeX, g_EyeY, g_EyeZ,   // eye position
 //                       0, 0, 0,                // look-at point (origin)
 //                       0, 1, 0);               // up vector (+y)

 //  // Pass the view projection matrix
 //  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

  // // Draw the scene:
  // drawMyScene(gl, u_ViewMatrix, viewMatrix);
 
 //    // Draw in the SECOND of several 'viewports'
  //------------------------------------------
  gl.viewport(gl.drawingBufferWidth/2,        // Viewport lower-left corner
              0,                              // location(in pixels)
              gl.drawingBufferWidth/2,        // viewport width, height.
              gl.drawingBufferHeight);

  // but use a different 'view' matrix:
  viewMatrix.setLookAt(-g_EyeX, g_EyeY, g_EyeZ, // eye position
                      -g_LookAtX, g_LookAtY, g_LookAtZ,                   // look-at point 
                      0, 1, 0);                 // up vector
  projMatrix.setPerspective(30, 1, 1, 100);
  // Pass the view projection matrix to our shaders:
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

  // Draw the scene:
  drawMyScene(gl, currentAngle, u_ViewMatrix, viewMatrix);
    
        // Draw in the THIRD of several 'viewports'
  //------------------------------------------
  gl.viewport(0                   ,         // Viewport lower-left corner
              0,    // location(in pixels)
              gl.drawingBufferWidth/2,        // viewport width, height.
              gl.drawingBufferHeight);

  // but use a different 'view' matrix:
  viewMatrix.setLookAt(-g_EyeX, g_EyeY, g_EyeZ, // eye position
                      -g_LookAtX, g_LookAtY, g_LookAtZ,                   // look-at point 
                      0, 1, 0);   
  projMatrix.setPerspective(90, 1, 1, 100);
  projMatrix.setOrtho(g_left, g_right, g_top, g_bottom, g_near, g_far);


  // Pass the view projection matrix to our shaders:
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);   

  
  // Draw the scene:
  drawMyScene(gl, currentAngle, u_ViewMatrix, viewMatrix);
}

function drawMyScene(myGL, currentAngle, myu_ViewMatrix, myViewMatrix) {
//===============================================================================
// Called ONLY from within the 'draw()' function
// Assumes already-correctly-set View matrix and Proj matrix; 
// draws all items in 'world' coords.

	// DON'T clear <canvas> or you'll WIPE OUT what you drew 
	// in all previous viewports!
	// myGL.clear(gl.COLOR_BUFFER_BIT);  						
// draw this many vertices.

  myViewMatrix.translate(4, 0, -7);

  myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES,
                rectanglestart/floatsPerVertex,
                rectangleVerts.length/floatsPerVertex);

  myViewMatrix.translate(0, -3, 0);
  myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);

  myGL.drawArrays(myGL.TRIANGLES,
                halfpyramidstart/floatsPerVertex,
                halfPyramidVerts.length/floatsPerVertex);

  myViewMatrix.translate(0, 5, 0);
  myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);

  myGL.drawArrays(myGL.TRIANGLES,
                rocketstart/floatsPerVertex,
                rocketVerts.length/floatsPerVertex);



  myViewMatrix.translate(-4, -8, 7);
  //myViewMatrix.rotate(-currentAngle, 1, 0, 0);
  myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);


  
 // Rotate to make a new set of 'world' drawing axes: 
 // old one had "+y points upwards", but
  myViewMatrix.rotate(-90, 1,0,0);	// new one has "+z points upwards",
  																		// made by rotating -90 deg on +x-axis.
  																		// Move those new drawing axes to the 
  																		// bottom of the trees:
	myViewMatrix.translate(0.0, 0.0, -1);

	myViewMatrix.scale(0.4, 0.4,0.4);		// shrink the drawing axes 
																			//for nicer-looking ground-plane, and
  // Pass the modified view matrix to our shaders:
  myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
  

  myGL.drawArrays(myGL.LINES,
                linestart/floatsPerVertex,
                lineVerts.length/floatsPerVertex);
  // Now, using these drawing axes, draw our ground plane: 
  myGL.drawArrays(myGL.LINES,							// use this drawing primitive, and
  							gndStart/floatsPerVertex,	// start at this vertex number, and
  							gndVerts.length/floatsPerVertex);		// draw this many vertices


  myViewMatrix.translate(-2, 0, 20);
    myViewMatrix.scale(2,2,2);
  //myViewMatrix.rotate(currentAngle, 1, 0, 0);
  myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);


  myGL.drawArrays(myGL.TRIANGLES,
                spherestart/floatsPerVertex,
                sphVerts.length/floatsPerVertex);

  //myViewMatrix.rotate(90, 0, 1, 1);
  
  myViewMatrix.translate(Math.cos(toRadians(currentAngle))*4, Math.sin(toRadians(currentAngle))*4, 0);
  myViewMatrix.scale(.8,.8,.8);
  myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES,
                spherestart/floatsPerVertex,
                sphVerts.length/floatsPerVertex);


  myViewMatrix.translate(Math.sin(toRadians(currentAngle*3))*2, Math.cos(toRadians(currentAngle*3))*2, 0);
  myViewMatrix.scale(.5,.5,.5);
  myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES,
                spherestart/floatsPerVertex,
                sphVerts.length/floatsPerVertex);

  myViewMatrix.scale(1,1,1);

  // myViewMatrix.setTranslate(1,1,1);
  // myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
  // myGL.drawArrays(myGL.TRIANGLES,
  //               squarestart/floatsPerVertex,
  //               squareVerts.length/floatsPerVertex);
}



// Last time that this function was called:  (used for animation timing)
var g_last = Date.now();

var ANGLE_STEP = 45;

function animate(angle) {
// //==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  
  // Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +20 and -85 degrees:
//  if(angle >  120.0 && ANGLE_STEP > 0) ANGLE_STEP = -ANGLE_STEP;
//  if(angle < -120.0 && ANGLE_STEP < 0) ANGLE_STEP = -ANGLE_STEP;

  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  //console.log(newAngle);
  return newAngle;
}

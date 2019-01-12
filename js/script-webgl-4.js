       var g = {};  // globals
        function init()
        {
            // Initialize
            var gl = initWebGL("example");
            if (!gl) {
              return;
            }
            g.program = simpleSetup(gl, "vshader", "fshader",
                                [ "vNormal", "vColor", "vPosition"],
                                [ 0, 0, 0, 1 ], 10000);

            // Set some uniform variables for the shaders
            gl.uniform3f(gl.getUniformLocation(g.program, "lightDir"), 0, 0, 1);
            gl.uniform1i(gl.getUniformLocation(g.program, "sampler2d"), 0);

            if (g.program) {
                g.u_normalMatrixLoc = gl.getUniformLocation(g.program, "u_normalMatrix");
                g.u_modelViewProjMatrixLoc = gl.getUniformLocation(g.program, "u_modelViewProjMatrix");
            }

            g.sphere = makeSphere(gl, 1, 30, 30);

            // Create a box. with the BufferObjects containing the arrays 
            // for vertices, normals, texture coords, and indices.
            //g.box = makeBox(gl);

            // Load an image to use. Returns a WebGLTexture object
            earthTexture = loadImageTexture(gl, "img/assets/earthmap1k.jpg");
            marsTexture = loadImageTexture(gl, "img/assets/mars500x250.png");
            spiritTexture = loadImageTexture(gl, "img/assets/spirit.jpg");

            return gl;
        }

        var width = -1;
        var height = -1;
        var framerate;
        var requestId;

        function reshape(ctx)
        {
            var canvas = document.getElementById('example');
            if (canvas.width == width && canvas.height == height)
                return;

            width = canvas.width;
            height = canvas.height;

            ctx.viewport(0, 0, width, height);

            g.perspectiveMatrix = new J3DIMatrix4();
            g.perspectiveMatrix.perspective(30, width/height, 1, 10000);
            g.perspectiveMatrix.lookat(0,0,6, 0, 0, 0, 0, 1, 0);
        }

        function drawOne(ctx, angle, x, y, z, scale, texture)
        {
            // setup VBOs
            ctx.enableVertexAttribArray(0);
            ctx.enableVertexAttribArray(1);
            ctx.enableVertexAttribArray(2);

            ctx.bindBuffer(ctx.ARRAY_BUFFER, g.sphere.vertexObject);
            ctx.vertexAttribPointer(2, 3, ctx.FLOAT, false, 0, 0);

            ctx.bindBuffer(ctx.ARRAY_BUFFER, g.sphere.normalObject);
            ctx.vertexAttribPointer(0, 3, ctx.FLOAT, false, 0, 0);

            ctx.bindBuffer(ctx.ARRAY_BUFFER, g.sphere.texCoordObject);
            ctx.vertexAttribPointer(1, 2, ctx.FLOAT, false, 0, 0);

            ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, g.sphere.indexObject);

            // generate the model-view matrix
            var mvMatrix = new J3DIMatrix4();
            mvMatrix.translate(x,y,z);
            mvMatrix.rotate(25, 1,0,0);
            mvMatrix.rotate(angle, 0,1,0);
            mvMatrix.scale(scale, scale, scale);

            // construct the normal matrix from the model-view matrix
            var normalMatrix = new J3DIMatrix4(mvMatrix);
            normalMatrix.invert();
            normalMatrix.transpose();
            normalMatrix.setUniform(ctx, g.u_normalMatrixLoc, false);

            // construct the model-view * projection matrix
            var mvpMatrix = new J3DIMatrix4(g.perspectiveMatrix);
            mvpMatrix.multiply(mvMatrix);
            mvpMatrix.setUniform(ctx, g.u_modelViewProjMatrixLoc, false);

            ctx.bindTexture(ctx.TEXTURE_2D, texture);
            ctx.drawElements(ctx.TRIANGLES, g.sphere.numIndices, ctx.UNSIGNED_SHORT, 0);
        }

        function drawPicture(ctx)
        {
            reshape(ctx);
            ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT);

            drawOne(ctx, currentAngle, -1, 0, 0, 1, earthTexture);
            drawOne(ctx, -currentAngle, 1, 0, 0, 0.6, marsTexture);

            framerate.snapshot();

            currentAngle += incAngle;
            if (currentAngle > 360)
                currentAngle -= 360;
        }

        function start()
        {
            var c = document.getElementById("example");
            var w = Math.floor(window.innerWidth * 0.9);
            var h = Math.floor(window.innerHeight * 0.9);

            //c = WebGLDebugUtils.makeLostContextSimulatingCanvas(c);
            // tell the simulator when to lose context.
            //c.loseContextInNCalls(1500);

            c.addEventListener('webglcontextlost', handleContextLost, false);
            c.addEventListener('webglcontextrestored', handleContextRestored, false);

            c.width = w;
            c.height = h;

            var ctx = init();
            if (!ctx) {
              return;
            }

            framerate = new Framerate("framerate");
            currentAngle = 0;
            incAngle = 0.2;

            function f() {
              drawPicture(ctx)
              requestId = window.requestAnimFrame(f, c);
            };
            f();

            function handleContextLost(e) {
                e.preventDefault();
                clearLoadingImages();
                if (requestId !== undefined) {
                    window.cancelAnimFrame(requestId);
                    requestId = undefined;
                }
            }

            function handleContextRestored() {
                init();
                f();
            }

        }
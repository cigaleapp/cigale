function e(e,t,n){let r=e.createShader(t);if(e.shaderSource(r,n),e.compileShader(r),!e.getShaderParameter(r,e.COMPILE_STATUS))throw console.error(`compile shader error:`,e.getShaderInfoLog(r)),e.deleteShader(r),Error(`compile shader error`);return r}function t(t,n,r){let i=e(t,t.VERTEX_SHADER,n),a=e(t,t.FRAGMENT_SHADER,r),o=t.createProgram();if(t.attachShader(o,i),t.attachShader(o,a),t.linkProgram(o),!t.getProgramParameter(o,t.LINK_STATUS))throw console.error(`link program error:`,t.getProgramInfoLog(o)),Error(`link program error`);return{program:o,vertexShader:i,fragmentShader:a}}function n(e,t){let n=e.createTexture();return e.bindTexture(e.TEXTURE_2D,n),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!0),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,t),n}function r(e,t,n){let r=e.createTexture();return e.bindTexture(e.TEXTURE_2D,r),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,t,n,0,e.RGBA,e.UNSIGNED_BYTE,null),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),r}function i(e,t){let n=e.createFramebuffer();return e.bindFramebuffer(e.FRAMEBUFFER,n),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,t,0),n}function a(e){let t=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,t);let n=new Float32Array([-1,-1,0,0,1,-1,1,0,-1,1,0,1,1,1,1,1]);return e.bufferData(e.ARRAY_BUFFER,n,e.STATIC_DRAW),t}function o(e,t,n,r,i){let a=e.getAttribLocation(t,r),o=e.getAttribLocation(t,i);e.bindBuffer(e.ARRAY_BUFFER,n),e.enableVertexAttribArray(a),e.vertexAttribPointer(a,2,e.FLOAT,!1,16,0),e.enableVertexAttribArray(o),e.vertexAttribPointer(o,2,e.FLOAT,!1,16,8)}var s=`#version 300 es
 precision highp float;
 in vec2 a_position;
 in vec2 a_texCoord;
 out vec2 v_texCoord;
 void main(){
   v_texCoord = a_texCoord;
   gl_Position = vec4(a_position, 0.0, 1.0);
 }
 `,c=`#version 300 es
 precision highp float;
 in vec2 v_texCoord;
 out vec4 outColor;

 uniform sampler2D u_image;
 uniform float u_textureWidth;
 uniform float u_scale;
 uniform float u_radius;

 const float PI = 3.141592653589793;

 /* FILTER_FUNCTION */

 void main(){
   float srcX = (v_texCoord.x * u_textureWidth);
   float left = srcX - u_radius;
   float right = srcX + u_radius;
   int start = int(floor(left));
   int end   = int(ceil(right));

   float sum = 0.0;
   vec4 color = vec4(0.0);
   for(int i = start; i <= end; i++){
     float weight = resizeFilter(((float(i) + 0.5) - srcX) * u_scale);
     float texX = (float(i) + 0.5) / u_textureWidth;
     vec4 sampleValue = texture(u_image, vec2(texX, v_texCoord.y));
     color += sampleValue * weight;
     sum += weight;
   }
   outColor = color / sum;
 }
 `,l=`#version 300 es
 precision mediump float;
 in vec2 v_texCoord;
 out vec4 outColor;

 uniform sampler2D u_image;
 uniform float u_textureWidth;
 uniform float u_textureHeight;
 uniform float u_scale;
 uniform float u_radius;
 const float PI = 3.141592653589793;

 /* FILTER_FUNCTION */

 void main(){
   float srcY = (v_texCoord.y * u_textureHeight);
   float top = srcY - u_radius;
   float bottom = srcY + u_radius;
   int start = int(floor(top));
   int end   = int(ceil(bottom));

   float sum = 0.0;
   vec4 color = vec4(0.0);
   for(int j = start; j <= end; j++){
     float weight = resizeFilter(((float(j) + 0.5) - srcY) * u_scale);
     float texY = (float(j) + 0.5) / u_textureHeight;
     vec4 sampleValue = texture(u_image, vec2(v_texCoord.x, texY));
     color += sampleValue * weight;
     sum += weight;
   }
   outColor = color / sum;
 }
 `,u={box:`float resizeFilter(float x) {
    x = abs(x);
    return (x < 0.5) ? 1.0 : 0.0;
 }`,hamming:`float resizeFilter(float x) {
    x = abs(x);
    if(x >= 1.0) return 0.0;
    if(x < 1.19209290E-7) return 1.0;
    float xpi = x * PI;
    return ((sin(xpi) / xpi) * (0.54 + 0.46 * cos(xpi / 1.0)));
 }`,lanczos2:`float resizeFilter(float x) {
   x = abs(x);
   if(x >= 2.0) return 0.0;
   if(x < 1.19209290E-7) return 1.0;
   float xpi = x * PI;
   return (sin(xpi) / xpi) * (sin(xpi / 2.0) / (xpi / 2.0));
 }`,lanczos3:`float resizeFilter(float x) {
    x = abs(x);
    if(x >= 3.0) return 0.0;
    if(x < 1.19209290E-7) return 1.0;
    float xpi = x * PI;
    return (sin(xpi) / xpi) * sin(xpi / 3.0) / (xpi / 3.0);
  }`,mks2013:`float resizeFilter(float x) {
    x = abs(x);
    if (x >= 2.5) { return 0.0; }
    if (x >= 1.5) { return -0.125 * (x - 2.5) * (x - 2.5); }
    if (x >= 0.5) { return 0.25 * (4.0 * x * x - 11.0 * x + 7.0); }
    return 1.0625 - 1.75 * x * x;
  }`},d={box:.5,hamming:1,lanczos2:2,lanczos3:3,mks2013:2.5};function f(e){return c.replace(`/* FILTER_FUNCTION */`,u[e])}function p(e){return l.replace(`/* FILTER_FUNCTION */`,u[e])}function m(e){return d[e]}function h(e,c,l){if(e.width===0||e.height===0)throw Error(`source canvas width or height is 0`);if(c.width===0||c.height===0)throw Error(`target canvas width or height is 0`);let u=c.getContext(`webgl2`);if(!u)throw Error(`webgl2 context not found`);let d=Math.round(l.targetWidth),h=Math.round(l.targetHeight),g=e.width,_=e.height,v=d/g,y=h/_,b=m(l.filter),x=n(u,e),S=a(u),C=r(u,d,_),w=i(u,C),T=t(u,s,f(l.filter)),E=T.program;u.useProgram(E),o(u,E,S,`a_position`,`a_texCoord`),u.uniform1i(u.getUniformLocation(E,`u_image`),0),u.uniform1f(u.getUniformLocation(E,`u_textureWidth`),g),u.uniform1f(u.getUniformLocation(E,`u_scale`),v),u.uniform1f(u.getUniformLocation(E,`u_radius`),b),u.activeTexture(u.TEXTURE0),u.bindTexture(u.TEXTURE_2D,x),u.viewport(0,0,d,_),u.bindFramebuffer(u.FRAMEBUFFER,w),u.drawArrays(u.TRIANGLE_STRIP,0,4);let D=t(u,s,p(l.filter)),O=D.program;u.useProgram(O),o(u,O,S,`a_position`,`a_texCoord`),u.uniform1i(u.getUniformLocation(O,`u_image`),0),u.uniform1f(u.getUniformLocation(O,`u_textureWidth`),d),u.uniform1f(u.getUniformLocation(O,`u_textureHeight`),_),u.uniform1f(u.getUniformLocation(O,`u_scale`),y),u.uniform1f(u.getUniformLocation(O,`u_radius`),b),u.activeTexture(u.TEXTURE0),u.bindTexture(u.TEXTURE_2D,C),u.viewport(0,0,d,h),u.bindFramebuffer(u.FRAMEBUFFER,null),u.drawArrays(u.TRIANGLE_STRIP,0,4),u.deleteTexture(x),u.deleteTexture(C),u.deleteProgram(T.program),u.deleteProgram(D.program),u.deleteShader(T.vertexShader),u.deleteShader(T.fragmentShader),u.deleteShader(D.vertexShader),u.deleteShader(D.fragmentShader),u.deleteFramebuffer(w),u.deleteBuffer(S)}export{h as resize};
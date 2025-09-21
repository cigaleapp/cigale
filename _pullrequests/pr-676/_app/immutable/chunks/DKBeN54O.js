function h(e,o,r){const t=e.createShader(o);if(e.shaderSource(t,r),e.compileShader(t),!e.getShaderParameter(t,e.COMPILE_STATUS))throw console.error("compile shader error:",e.getShaderInfoLog(t)),e.deleteShader(t),new Error("compile shader error");return t}function l(e,o,r){const t=h(e,e.VERTEX_SHADER,o),a=h(e,e.FRAGMENT_SHADER,r),i=e.createProgram();if(e.attachShader(i,t),e.attachShader(i,a),e.linkProgram(i),!e.getProgramParameter(i,e.LINK_STATUS))throw console.error("link program error:",e.getProgramInfoLog(i)),new Error("link program error");return{program:i,vertexShader:t,fragmentShader:a}}function v(e,o){const r=e.createTexture();return e.bindTexture(e.TEXTURE_2D,r),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!0),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,o),r}function b(e,o,r){const t=e.createTexture();return e.bindTexture(e.TEXTURE_2D,t),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,o,r,0,e.RGBA,e.UNSIGNED_BYTE,null),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),t}function I(e,o){const r=e.createFramebuffer();return e.bindFramebuffer(e.FRAMEBUFFER,r),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,o,0),r}function L(e){const o=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,o);const r=new Float32Array([-1,-1,0,0,1,-1,1,0,-1,1,0,1,1,1,1,1]);return e.bufferData(e.ARRAY_BUFFER,r,e.STATIC_DRAW),o}function R(e,o,r,t,a){const i=e.getAttribLocation(o,t),f=e.getAttribLocation(o,a);e.bindBuffer(e.ARRAY_BUFFER,r),e.enableVertexAttribArray(i),e.vertexAttribPointer(i,2,e.FLOAT,!1,16,0),e.enableVertexAttribArray(f),e.vertexAttribPointer(f,2,e.FLOAT,!1,16,8)}const F=`#version 300 es
 precision highp float;
 in vec2 a_position;
 in vec2 a_texCoord;
 out vec2 v_texCoord;
 void main(){
   v_texCoord = a_texCoord;
   gl_Position = vec4(a_position, 0.0, 1.0);
 }
 `,P=`#version 300 es
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
 `,S=`#version 300 es
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
 `,w=`float resizeFilter(float x) {
    x = abs(x);
    return (x < 0.5) ? 1.0 : 0.0;
 }`,X=`float resizeFilter(float x) {
    x = abs(x);
    if(x >= 1.0) return 0.0;
    if(x < 1.19209290E-7) return 1.0;
    float xpi = x * PI;
    return ((sin(xpi) / xpi) * (0.54 + 0.46 * cos(xpi / 1.0)));
 }`,C=`float resizeFilter(float x) {
   x = abs(x);
   if(x >= 2.0) return 0.0;
   if(x < 1.19209290E-7) return 1.0;
   float xpi = x * PI;
   return (sin(xpi) / xpi) * (sin(xpi / 2.0) / (xpi / 2.0));
 }`,D=`float resizeFilter(float x) {
    x = abs(x);
    if(x >= 3.0) return 0.0;
    if(x < 1.19209290E-7) return 1.0;
    float xpi = x * PI;
    return (sin(xpi) / xpi) * sin(xpi / 3.0) / (xpi / 3.0);
  }`,N=`float resizeFilter(float x) {
    x = abs(x);
    if (x >= 2.5) { return 0.0; }
    if (x >= 1.5) { return -0.125 * (x - 2.5) * (x - 2.5); }
    if (x >= 0.5) { return 0.25 * (4.0 * x * x - 11.0 * x + 7.0); }
    return 1.0625 - 1.75 * x * x;
  }`,A={box:w,hamming:X,lanczos2:C,lanczos3:D,mks2013:N},z={box:.5,hamming:1,lanczos2:2,lanczos3:3,mks2013:2.5};function B(e){return P.replace("/* FILTER_FUNCTION */",A[e])}function M(e){return S.replace("/* FILTER_FUNCTION */",A[e])}function G(e){return z[e]}function W(e,o,r){if(e.width===0||e.height===0)throw new Error("source canvas width or height is 0");if(o.width===0||o.height===0)throw new Error("target canvas width or height is 0");const t=o.getContext("webgl2");if(!t)throw new Error("webgl2 context not found");const a=Math.round(r.targetWidth),i=Math.round(r.targetHeight),f=e.width,c=e.height,p=a/f,U=i/c,_=G(r.filter),E=v(t,e),m=L(t),d=b(t,a,c),T=I(t,d),s=l(t,F,B(r.filter)),u=s.program;t.useProgram(u),R(t,u,m,"a_position","a_texCoord"),t.uniform1i(t.getUniformLocation(u,"u_image"),0),t.uniform1f(t.getUniformLocation(u,"u_textureWidth"),f),t.uniform1f(t.getUniformLocation(u,"u_scale"),p),t.uniform1f(t.getUniformLocation(u,"u_radius"),_),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,E),t.viewport(0,0,a,c),t.bindFramebuffer(t.FRAMEBUFFER,T),t.drawArrays(t.TRIANGLE_STRIP,0,4);const x=l(t,F,M(r.filter)),n=x.program;t.useProgram(n),R(t,n,m,"a_position","a_texCoord"),t.uniform1i(t.getUniformLocation(n,"u_image"),0),t.uniform1f(t.getUniformLocation(n,"u_textureWidth"),a),t.uniform1f(t.getUniformLocation(n,"u_textureHeight"),c),t.uniform1f(t.getUniformLocation(n,"u_scale"),U),t.uniform1f(t.getUniformLocation(n,"u_radius"),_),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,d),t.viewport(0,0,a,i),t.bindFramebuffer(t.FRAMEBUFFER,null),t.drawArrays(t.TRIANGLE_STRIP,0,4),t.deleteTexture(E),t.deleteTexture(d),t.deleteProgram(s.program),t.deleteProgram(x.program),t.deleteShader(s.vertexShader),t.deleteShader(s.fragmentShader),t.deleteShader(x.vertexShader),t.deleteShader(x.fragmentShader),t.deleteFramebuffer(T),t.deleteBuffer(m)}export{W as resize};

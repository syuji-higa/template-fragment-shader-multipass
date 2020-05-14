#version 300 es

precision highp float;

uniform vec2 resolution;
uniform vec2 mouse;
uniform float time;
in vec2 vTextureCoord;
out vec4 outColor;

#define R resolution
#define T time
#define rot(a) mat2(cos(a),-sin(a),sin(a),cos(a))

float sphDf(vec3 p) {
  return length(p) - .5;
}

float map(vec3 p) {
  p.z += T*2.;
  p.xy *= rot(T*.5);
  p = mod(p, 2.) - 1.;
  float sph = sphDf(p);
  return sph;
}

vec3 norm(vec3 p) {
  vec2 e = vec2(.001, 0.);
  float d = map(p);
  return normalize(
    vec3(d - map(p-e.xyy), d - map(p-e.yxy), d - map(p-e.yyx))
  );
}

float shadow(vec3 p, vec3 ray, float k) {
  float d, t = 0., s = 1.;
  for(int i = 0; i < 32; i++){
    vec3 rp = p + t*ray;
    t += d = map(rp);
    if(d < .001){
      s = 0.;
      break;
    }
    s = min(s, k*d/t);
  }
  return s;
}

float ao(vec3 p, vec3 no, float k){
  const float smp = 5.;
  float ao = 0.;
  for(float i = 1.; i <= smp; i++){
    float ii = i/smp, d = k*ii;
    vec3 rp = p + d*no;
    ao += (d-map(rp)) * exp(ii);
  }
  return 1. - max(ao, 0.);
}

void main(void) {
  vec2 p = (gl_FragCoord.xy * 2. - R) / max(R.x, R.y);
  
  vec3 cp = vec3(0., 0., -1), ct = vec3(0., 0., 0.),
    cf = normalize(ct-cp), cu = vec3(0., 1., 0.);
  vec3 cl = normalize(cross(cu, cf)); cu = normalize(cross(cf, cl));
  vec3 ray = normalize(p.x*cl + p.y*cu + cf), c = vec3(0.);
  float d, t = 0.;
  
  for(int i = 0; i < 64; i++) {
    vec3 rp = cp + t*ray;
    t += d = map(rp);
    if(d < .001) {
      vec3 no = norm(rp), lp = vec3(-1., 1., -1.), ld = normalize(lp - rp);
      float sha = max(shadow(rp+no*.001, ld, 8.), .5);
      float dif = max(dot(no, ld), 0.);
      float spe = pow(max(dot(-ray, reflect(-ld, no)), 0.), 8.) * .3;
      c = vec3(1.) * ao(rp, no, .05) * sha * dif + spe;
      break;
    }
  }

  outColor = vec4(c, pow(t,2.)*0.1);
}

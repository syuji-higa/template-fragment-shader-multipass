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

float boxDf(vec3 p) {
  p.xy *= rot(-T*.3);
  p.yz *= rot(T*.2);
  vec3 q = abs(p) - 0.5;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - 0.03;
}

float map(vec3 p) {
  p.z += T*2.;
  p.xy *= rot(T*.5);
  p = mod(p, 4.) - 2.;
  float sph = boxDf(p);
  return sph;
}

vec3 norm(vec3 p) {
  vec2 e = vec2(.001, 0.);
  float d = map(p);
  return normalize(
    vec3(d - map(p-e.xyy), d - map(p-e.yxy), d - map(p-e.yyx))
  );
}

void main(void) {
  vec2 p = (gl_FragCoord.xy * 2. - R) / max(R.x, R.y);
  
  vec3 cp = vec3(0., 0., -1), ct = vec3(0., 0., 0.),
    cf = normalize(ct-cp), cu = vec3(0., 1., 0.);
  vec3 cl = normalize(cross(cu, cf)); cu = normalize(cross(cf, cl));
  vec3 ray = normalize(p.x*cl + p.y*cu + cf), c = vec3(0.);
  float d, t = 0.;
  
  for(int i = 0; i < 128; i++) {
    vec3 rp = cp + t*ray;
    d = map(rp) * .3;
    t += min(min((step(0.,ray.x)-fract(rp.x))/ray.x,(step(0.,ray.z)-fract(rp.z))/ray.z)+.01,d);
    if(d < .001) {
      vec3 no = norm(rp), lp = vec3(-1., 1., -1.), ld = normalize(lp - rp);
      float dif = max(dot(no, ld), 0.);
      float spe = pow(max(dot(-ray, reflect(-ld, no)), 0.), 8.) * .3;
      c = vec3(1.) * dif + spe;
      break;
    }
  }

  outColor = vec4(c - pow(t*0.04, 2.), abs(t*0.03-0.15));
}

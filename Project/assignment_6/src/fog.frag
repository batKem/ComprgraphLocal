//=============================================================================
//
//   Exercise code for the lecture "Introduction to Computer Graphics"
//     by Prof. Mario Botsch, Bielefeld University
//
//   Copyright (C) by Computer Graphics Group, Bielefeld University
//
//=============================================================================

#version 140


in vec3 v2f_normal;
in vec2 v2f_texcoord;
in vec3 v2f_light;
in vec3 v2f_view;
in vec3 v2f_frageyepos;
in vec3 v2f_eye_world_pos;
in vec3 v2f_fragworldpos;
in float v2f_fogtime;

out vec4 f_color;

uniform sampler2D tex;
uniform int fog_selector;

const float shininess = 8.0;
const vec3  sunlight = vec3(1.0, 0.941, 0.898);

// extended simples 4d -----------------------------------------------------
// by Afan Olovcic - DevDad
// an extended from the implementation written by Stefan Gustavson
// https://github.com/devdad/SimplexNoise/blob/master/Source/SimplexNoise/Private/SimplexNoiseBPLibrary.cpp
#define F4_ 0.309016994f // F4_ = (Math.sqrt(5.0)-1.0)/4.0
#define G4 0.138196601f // G4 = (5.0-Math.sqrt(5.0))/20.0
int fastfloor(float x){
    if (x > 0){
        return int(x);
    } else {
        return int(x) -1;
    }
}
const vec4 simplex[64] = vec4 [64](

    vec4(0,1,2,3),
    vec4(0,1,3,2),
    vec4(0,0,0,0),
    vec4(0,2,3,1),
    vec4(0,0,0,0),
    vec4(0,0,0,0),
    vec4(0,0,0,0),
    vec4(1,2,3,0),

    vec4(0,2,1,3),
    vec4(0,0,0,0),
    vec4(0,3,1,2),
    vec4(0,3,2,1),
    vec4(0,0,0,0),
    vec4(0,0,0,0),
    vec4(0,0,0,0),
    vec4(1,3,2,0),

    vec4(0,0,0,0),
    vec4(0,0,0,0),
    vec4(0,0,0,0),
    vec4(0,0,0,0),
    vec4(0,0,0,0),
    vec4(0,0,0,0),
    vec4(0,0,0,0),
    vec4(0,0,0,0),

    vec4(1,2,0,3),
    vec4(0,0,0,0),
    vec4(1,3,0,2),
    vec4( 0,0,0,0),
    vec4( 0,0,0,0),
    vec4( 0,0,0,0),
    vec4(2,3,0,1),
    vec4(2,3,1,0),

    vec4(1,0,2,3 ),
    vec4(1,0,3,2),
    vec4(0,0,0,0 ),
    vec4(0,0,0,0 ),
    vec4(0,0,0,0 ),
    vec4(2,0,3,1),
    vec4(0,0,0,0),
    vec4(2,1,3,0),

    vec4(0,0,0,0),
    vec4(0,0,0,0),
    vec4(0,0,0,0),
    vec4(0,0,0,0),
    vec4(0,0,0,0),
    vec4(0,0,0,0),
    vec4(0,0,0,0),
    vec4(0,0,0,0),

    vec4(2,0,1,3 ),
    vec4(0,0,0,0),
    vec4(0,0,0,0),
    vec4(0,0,0,0),
    vec4(3,0,1,2),
    vec4(3,0,2,1),
    vec4(0,0,0,0),
    vec4(3,1,2,0 ),

    vec4(2,1,0,3),
    vec4(0,0,0,0),
    vec4(0,0,0,0),
    vec4(0,0,0,0),
    vec4(3,1,0,2),
    vec4(0,0,0,0),
    vec4(3,2,0,1),
    vec4( 3,2,1,0)

	//{ 0,1,2,3 },{ 0,1,3,2 },{ 0,0,0,0 },{ 0,2,3,1 },{ 0,0,0,0 },{ 0,0,0,0 },{ 0,0,0,0 },{ 1,2,3,0 },
	//{ 0,2,1,3 },{ 0,0,0,0 },{ 0,3,1,2 },{ 0,3,2,1 },{ 0,0,0,0 },{ 0,0,0,0 },{ 0,0,0,0 },{ 1,3,2,0 },
	//{ 0,0,0,0 },{ 0,0,0,0 },{ 0,0,0,0 },{ 0,0,0,0 },{ 0,0,0,0 },{ 0,0,0,0 },{ 0,0,0,0 },{ 0,0,0,0 },
	//{ 1,2,0,3 },{ 0,0,0,0 },{ 1,3,0,2 },{ 0,0,0,0 },{ 0,0,0,0 },{ 0,0,0,0 },{ 2,3,0,1 },{ 2,3,1,0 },
	//{ 1,0,2,3 },{ 1,0,3,2 },{ 0,0,0,0 },{ 0,0,0,0 },{ 0,0,0,0 },{ 2,0,3,1 },{ 0,0,0,0 },{ 2,1,3,0 },
	//{ 0,0,0,0 },{ 0,0,0,0 },{ 0,0,0,0 },{ 0,0,0,0 },{ 0,0,0,0 },{ 0,0,0,0 },{ 0,0,0,0 },{ 0,0,0,0 },
	//{ 2,0,1,3 },{ 0,0,0,0 },{ 0,0,0,0 },{ 0,0,0,0 },{ 3,0,1,2 },{ 3,0,2,1 },{ 0,0,0,0 },{ 3,1,2,0 },
    //{ 2,1,0,3 },{ 0,0,0,0 },{ 0,0,0,0 },{ 0,0,0,0 },{ 3,1,0,2 },{ 0,0,0,0 },{ 3,2,0,1 },{ 3,2,1,0 } 

);
float grad(int hash, float x, float y, float z, float t){
	int h = hash & 31;      // Convert low 5 bits of hash code into 32 simple
	float u=0.0f;
    float v=0.0f;
    float w=0.0f;
    if(h<24){
        u=x;
    } else {
        u=y;
    }
    if(h<16){
        v=y;
    } else {
        v=z;
    }
    if(h<8){
        w=z;
    } else {
        w=t;
    }

    float res = 0.0f;
    if ((h&1)==1){
        res = -u;
    } else {
        res = u;
    }
    if ((h&2)==1){
        res += -v;
    } else {
        res += v;
    }
    if ((h&4)==1){
        res += -w;
    } else {
        res += w;
    }
    return res;
	//return ((h & 1) ? -u : u) + ((h & 2) ? -v : v) + ((h & 4) ? -w : w);  //----------------
}

const int perm[512] = int[512](151,160,137,91,90,15,
131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180,
151,160,137,91,90,15,
131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
);
float simplexNoise4D(vec4 P) {

    float x = P.x;
    float y = P.y;
    float z = P.z;
    float w = P.w;

	float n0, n1, n2, n3, n4; // Noise contributions from the five corners

							  // Skew the (x,y,z,w) space to determine which cell of 24 simplices we're in
	float s = (x + y + z + w) * F4_; // Factor for 4D skewing
	float xs = x + s;
	float ys = y + s;
	float zs = z + s;
	float ws = w + s;

	int i = fastfloor(xs);
	int j = fastfloor(ys);
	int k = fastfloor(zs);
	int l = fastfloor(ws);

	float t = (i + j + k + l) * G4; // Factor for 4D unskewing
	float X0 = i - t; // Unskew the cell origin back to (x,y,z,w) space
	float Y0 = j - t;
	float Z0 = k - t;
	float W0 = l - t;

	float x0 = x - X0;  // The x,y,z,w distances from the cell origin
	float y0 = y - Y0;
	float z0 = z - Z0;
	float w0 = w - W0;

	// For the 4D case, the simplex is a 4D shape I won't even try to describe.
	// To find out which of the 24 possible simplices we're in, we need to
	// determine the magnitude ordering of x0, y0, z0 and w0.
	// The method below is a good way of finding the ordering of x,y,z,w and
	// then find the correct traversal order for the simplex were in.
	// First, six pair-wise comparisons are performed between each possible pair
	// of the four coordinates, and the results are used to add up binary bits
	// for an integer index.
	int c1 = (x0 > y0) ? 32 : 0;
	int c2 = (x0 > z0) ? 16 : 0;
	int c3 = (y0 > z0) ? 8 : 0;
	int c4 = (x0 > w0) ? 4 : 0;
	int c5 = (y0 > w0) ? 2 : 0;
	int c6 = (z0 > w0) ? 1 : 0;
	int c = c1 + c2 + c3 + c4 + c5 + c6;

	int i1, j1, k1, l1; // The integer offsets for the second simplex corner
	int i2, j2, k2, l2; // The integer offsets for the third simplex corner
	int i3, j3, k3, l3; // The integer offsets for the fourth simplex corner

						// simplex[c] is a 4-vector with the numbers 0, 1, 2 and 3 in some order.
						// Many values of c will never occur, since e.g. x>y>z>w makes x<z, y<w and x<w
						// impossible. Only the 24 indices which have non-zero entries make any sense.
						// We use a thresholding to set the coordinates in turn from the largest magnitude.
						// The number 3 in the "simplex" array is at the position of the largest coordinate.
	i1 = simplex[c][0] >= 3 ? 1 : 0;
	j1 = simplex[c][1] >= 3 ? 1 : 0;
	k1 = simplex[c][2] >= 3 ? 1 : 0;
	l1 = simplex[c][3] >= 3 ? 1 : 0;
	// The number 2 in the "simplex" array is at the second largest coordinate.
	i2 = simplex[c][0] >= 2 ? 1 : 0;
	j2 = simplex[c][1] >= 2 ? 1 : 0;
	k2 = simplex[c][2] >= 2 ? 1 : 0;
	l2 = simplex[c][3] >= 2 ? 1 : 0;
	// The number 1 in the "simplex" array is at the second smallest coordinate.
	i3 = simplex[c][0] >= 1 ? 1 : 0;
	j3 = simplex[c][1] >= 1 ? 1 : 0;
	k3 = simplex[c][2] >= 1 ? 1 : 0;
	l3 = simplex[c][3] >= 1 ? 1 : 0;
	// The fifth corner has all coordinate offsets = 1, so no need to look that up.

	float x1 = x0 - i1 + G4; // Offsets for second corner in (x,y,z,w) coords
	float y1 = y0 - j1 + G4;
	float z1 = z0 - k1 + G4;
	float w1 = w0 - l1 + G4;
	float x2 = x0 - i2 + 2.0f*G4; // Offsets for third corner in (x,y,z,w) coords
	float y2 = y0 - j2 + 2.0f*G4;
	float z2 = z0 - k2 + 2.0f*G4;
	float w2 = w0 - l2 + 2.0f*G4;
	float x3 = x0 - i3 + 3.0f*G4; // Offsets for fourth corner in (x,y,z,w) coords
	float y3 = y0 - j3 + 3.0f*G4;
	float z3 = z0 - k3 + 3.0f*G4;
	float w3 = w0 - l3 + 3.0f*G4;
	float x4 = x0 - 1.0f + 4.0f*G4; // Offsets for last corner in (x,y,z,w) coords
	float y4 = y0 - 1.0f + 4.0f*G4;
	float z4 = z0 - 1.0f + 4.0f*G4;
	float w4 = w0 - 1.0f + 4.0f*G4;

	// Wrap the integer indices at 256, to avoid indexing perm[] out of bounds
	int ii = i & 0xff;
	int jj = j & 0xff;
	int kk = k & 0xff;
	int ll = l & 0xff;

	// Calculate the contribution from the five corners
	float t0 = 0.6f - x0*x0 - y0*y0 - z0*z0 - w0*w0;
	if (t0 < 0.0f) n0 = 0.0f;
	else {
		t0 *= t0;
		n0 = t0 * t0 * grad(perm[ii + perm[jj + perm[kk + perm[ll]]]], x0, y0, z0, w0);
	}

	float t1 = 0.6f - x1*x1 - y1*y1 - z1*z1 - w1*w1;
	if (t1 < 0.0f) n1 = 0.0f;
	else {
		t1 *= t1;
		n1 = t1 * t1 * grad(perm[ii + i1 + perm[jj + j1 + perm[kk + k1 + perm[ll + l1]]]], x1, y1, z1, w1);
	}

	float t2 = 0.6f - x2*x2 - y2*y2 - z2*z2 - w2*w2;
	if (t2 < 0.0f) n2 = 0.0f;
	else {
		t2 *= t2;
		n2 = t2 * t2 * grad(perm[ii + i2 + perm[jj + j2 + perm[kk + k2 + perm[ll + l2]]]], x2, y2, z2, w2);
	}

	float t3 = 0.6f - x3*x3 - y3*y3 - z3*z3 - w3*w3;
	if (t3 < 0.0f) n3 = 0.0f;
	else {
		t3 *= t3;
		n3 = t3 * t3 * grad(perm[ii + i3 + perm[jj + j3 + perm[kk + k3 + perm[ll + l3]]]], x3, y3, z3, w3);
	}

	float t4 = 0.6f - x4*x4 - y4*y4 - z4*z4 - w4*w4;
	if (t4 < 0.0f) n4 = 0.0f;
	else {
		t4 *= t4;
		n4 = t4 * t4 * grad(perm[ii + 1 + perm[jj + 1 + perm[kk + 1 + perm[ll + 1]]]], x4, y4, z4, w4);
	}

	// Sum up and scale the result to cover the range [-1,1]
	return 27.0f * (n0 + n1 + n2 + n3 + n4); 
}

// end simples 4d -----------------------------------------------------

// simplex noise en 4d 
// by Ashima Arts and Stefan Gustavson
// https://github.com/ashima/webgl-noise/blob/master/src/noise4D.glsl
vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0; }

float mod289(float x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0; }

vec4 permute_(vec4 x) {
     return mod289(((x*34.0)+1.0)*x);
}

float permute_(float x) {
     return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt_(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

float taylorInvSqrt_(float r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

vec4 grad4(float j, vec4 ip)
  {
  const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
  vec4 p,s;

  p.xyz = floor( fract (vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
  p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
  s = vec4(lessThan(p, vec4(0.0)));
  p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www; 

  return p;
  }
						
// (sqrt(5) - 1)/4 = F4, used once below
#define F4 0.309016994374947451
float snoise(vec4 v){
  const vec4  C = vec4( 0.138196601125011,  // (5 - sqrt(5))/20  G4
                        0.276393202250021,  // 2 * G4
                        0.414589803375032,  // 3 * G4
                       -0.447213595499958); // -1 + 4 * G4

    // First corner
  vec4 i  = floor(v + dot(v, vec4(F4)) );
  vec4 x0 = v -   i + dot(i, C.xxxx);

    // Other corners

    // Rank sorting originally contributed by Bill Licea-Kane, AMD (formerly ATI)
  vec4 i0;
  vec3 isX = step( x0.yzw, x0.xxx );
  vec3 isYZ = step( x0.zww, x0.yyz );
    //  i0.x = dot( isX, vec3( 1.0 ) );
  i0.x = isX.x + isX.y + isX.z;
  i0.yzw = 1.0 - isX;
    //  i0.y += dot( isYZ.xy, vec2( 1.0 ) );
  i0.y += isYZ.x + isYZ.y;
  i0.zw += 1.0 - isYZ.xy;
  i0.z += isYZ.z;
  i0.w += 1.0 - isYZ.z;

  // i0 now contains the unique values 0,1,2,3 in each channel
  vec4 i3 = clamp( i0, 0.0, 1.0 );
  vec4 i2 = clamp( i0-1.0, 0.0, 1.0 );
  vec4 i1 = clamp( i0-2.0, 0.0, 1.0 );

  //  x0 = x0 - 0.0 + 0.0 * C.xxxx
  //  x1 = x0 - i1  + 1.0 * C.xxxx
  //  x2 = x0 - i2  + 2.0 * C.xxxx
  //  x3 = x0 - i3  + 3.0 * C.xxxx
  //  x4 = x0 - 1.0 + 4.0 * C.xxxx
  vec4 x1 = x0 - i1 + C.xxxx;
  vec4 x2 = x0 - i2 + C.yyyy;
  vec4 x3 = x0 - i3 + C.zzzz;
  vec4 x4 = x0 + C.wwww;

 // Permutations
  i = mod289(i); 
  float j0 = permute_( permute_( permute_( permute_(i.w) + i.z) + i.y) + i.x);
  vec4 j1 = permute_( permute_( permute_( permute_ (
             i.w + vec4(i1.w, i2.w, i3.w, 1.0 ))
           + i.z + vec4(i1.z, i2.z, i3.z, 1.0 ))
           + i.y + vec4(i1.y, i2.y, i3.y, 1.0 ))
           + i.x + vec4(i1.x, i2.x, i3.x, 1.0 ));

    // Gradients: 7x7x6 points over a cube, mapped onto a 4-cross polytope
    // 7*7*6 = 294, which is close to the ring size 17*17 = 289.
  vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0) ;

  vec4 p0 = grad4(j0,   ip);
  vec4 p1 = grad4(j1.x, ip);
  vec4 p2 = grad4(j1.y, ip);
  vec4 p3 = grad4(j1.z, ip);
  vec4 p4 = grad4(j1.w, ip);

    // Normalise gradients
  vec4 norm = taylorInvSqrt_(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  p4 *= taylorInvSqrt_(dot(p4,p4));

    // Mix contributions from the five corners
  vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
  vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)            ), 0.0);
  m0 = m0 * m0;
  m1 = m1 * m1;
  return 49.0 * ( dot(m0*m0, vec3( dot( p0, x0 ), dot( p1, x1 ), dot( p2, x2 )))
               + dot(m1*m1, vec2( dot( p3, x3 ), dot( p4, x4 ) ) ) ) ;

}
// end snoise en 4d -----------------------------------------------------




//----------------------------------------------------------------------------------
// assignment 9 3D

float n_max(float a, float b){
    if(a > b){
        return a;
    } else {
        return b;
    }

}

float n_pow(float a){
    float b = a*a;
    return b;
}
/*
int hash_3d (vec3 point){
    float hash = 0.0f;
    float max_ = n_max(point.x, n_max(point.y, point.z));
    hash += max_*max_*max_+ 2*max_*point.z + point.z;
    if (max_ == point.z){
        hash += n_pow(n_max(point.x,point.y));
    } else if (point.y > point.x){
        hash += point.x + point.y;
    } else {
        hash += point.y; 
    }
    return int(hash);
}
*/
float hash_poly(float x) {
	return mod(((x*34.0)+1.0)*x, 289.0);
}

// -- Hash function --
// For 1d case, use vec2(c, 0)
int hash_3d(vec3 grid_point) {
	return int(hash_poly(hash_poly(hash_poly(grid_point.x) + grid_point.y)) +grid_point.z); //not a consistent definition
}

// -- Smooth interpolation polynomial --
// Use mix(a, b, blending_weight_poly(t))
float blending_weight_poly(float t) {
	return t*t*t*(t*(t*6.0 - 15.0)+10.0);
}

// -- Gradient table --
// use gradients[hash % NUM_GRADIENTS] to access the gradient corresponding
// to a hashed grid point location
#define NUM_GRADIENTS 36
const vec3 gradients[NUM_GRADIENTS] = vec3[NUM_GRADIENTS](
	vec3( 1,  1, 0),
	vec3(-1,  1, 0),
	vec3( 1, -1, 0),
	vec3(-1, -1, 0),
	vec3( 1,  0, 0),
	vec3(-1,  0, 0),
	vec3( 1,  0, 0),
	vec3(-1,  0, 0),
	vec3( 0,  1, 0),
	vec3( 0, -1, 0),
	vec3( 0,  1, 0),
	vec3( 0, -1, 0),

    vec3( 1,  1, 1),
	vec3(-1,  1, 1),
	vec3( 1, -1, 1),
	vec3(-1, -1, 1),
	vec3( 1,  0, 1),
	vec3(-1,  0, 1),
	vec3( 1,  0, 1),
	vec3(-1,  0, 1),
	vec3( 0,  1, 1),
	vec3( 0, -1, 1),
	vec3( 0,  1, 1),
	vec3( 0, -1, 1),

    vec3( 1,  1, -1),
	vec3(-1,  1, -1),
	vec3( 1, -1, -1),
	vec3(-1, -1, -1),
	vec3( 1,  0, -1),
	vec3(-1,  0, -1),
	vec3( 1,  0, -1),
	vec3(-1,  0, -1),
	vec3( 0,  1, -1),
	vec3( 0, -1, -1),
	vec3( 0,  1, -1),
	vec3( 0, -1, -1)
);
float perlin_noise(vec3 point) {

	float down_x = floor(point.x);
	float down_y = floor(point.y);
    float down_z = floor(point.z);

	vec3 c_000 = vec3(down_x, down_y,down_z);
	vec3 c_010 = vec3(down_x, down_y + 1.0,down_z);
	vec3 c_100 = vec3(down_x + 1.0, down_y,down_z);
	vec3 c_110 = vec3(down_x + 1.0, down_y + 1.0,down_z);

    vec3 c_001 = vec3(down_x, down_y,down_z+1);
	vec3 c_011 = vec3(down_x, down_y + 1.0,down_z+1);
	vec3 c_101 = vec3(down_x + 1.0, down_y,down_z+1);
	vec3 c_111 = vec3(down_x + 1.0, down_y + 1.0,down_z+1);

	vec3 g_000 = gradients[hash_3d(c_000) % NUM_GRADIENTS];
	vec3 g_010 = gradients[hash_3d(c_010) % NUM_GRADIENTS];
	vec3 g_100 = gradients[hash_3d(c_100) % NUM_GRADIENTS];
	vec3 g_110 = gradients[hash_3d(c_110) % NUM_GRADIENTS];

	vec3 g_001 = gradients[hash_3d(c_001) % NUM_GRADIENTS];
	vec3 g_011 = gradients[hash_3d(c_011) % NUM_GRADIENTS];
	vec3 g_101 = gradients[hash_3d(c_101) % NUM_GRADIENTS];
	vec3 g_111 = gradients[hash_3d(c_111) % NUM_GRADIENTS];

	float phi_000 = dot(g_000, point - c_000);
	float phi_010 = dot(g_010, point - c_010);
	float phi_100 = dot(g_100, point - c_100);
	float phi_110 = dot(g_110, point - c_110);

	float phi_001 = dot(g_001, point - c_001);
	float phi_011 = dot(g_011, point - c_011);
	float phi_101 = dot(g_101, point - c_101);
	float phi_111 = dot(g_111, point - c_111);

	float distance_x0 = point.x - c_000.x ;
	float mix_00 = mix(phi_000, phi_100, blending_weight_poly(distance_x0));
	float mix_10 = mix(phi_010, phi_110, blending_weight_poly(distance_x0));
	float distance_y0 = point.y - c_000.y;
	float noise_0 = mix(mix_00, mix_10, blending_weight_poly(distance_y0));

    float distance_x1 = point.x - c_001.x ;
	float mix_01 = mix(phi_001, phi_101, blending_weight_poly(distance_x1));
	float mix_11 = mix(phi_011, phi_111, blending_weight_poly(distance_x1));
	float distance_y1 = point.y - c_001.y;
	float noise_1 = mix(mix_01, mix_11, blending_weight_poly(distance_y1));

    float distance_z = point.z -c_000.z;
    float noise_3 = mix (noise_0, noise_1, blending_weight_poly(distance_z) );

	return noise_3;
}
//	Classic Perlin 3D Noise 
//	by Stefan Gustavson
//  https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83?fbclid=IwAR2DvJ1CIHA-I4FmMAD44Zp46p3cx3VbhD0meYSodMxDwQNRJHKwOYNhAPU
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
vec4 fade(vec4 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

float cnoise(vec4 P){
  vec4 Pi0 = floor(P); // Integer part for indexing
  vec4 Pi1 = Pi0 + 1.0; // Integer part + 1
  Pi0 = mod(Pi0, 289.0);
  Pi1 = mod(Pi1, 289.0);
  vec4 Pf0 = fract(P); // Fractional part for interpolation
  vec4 Pf1 = Pf0 - 1.0; // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = vec4(Pi0.zzzz);
  vec4 iz1 = vec4(Pi1.zzzz);
  vec4 iw0 = vec4(Pi0.wwww);
  vec4 iw1 = vec4(Pi1.wwww);

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);
  vec4 ixy00 = permute(ixy0 + iw0);
  vec4 ixy01 = permute(ixy0 + iw1);
  vec4 ixy10 = permute(ixy1 + iw0);
  vec4 ixy11 = permute(ixy1 + iw1);

  vec4 gx00 = ixy00 / 7.0;
  vec4 gy00 = floor(gx00) / 7.0;
  vec4 gz00 = floor(gy00) / 6.0;
  gx00 = fract(gx00) - 0.5;
  gy00 = fract(gy00) - 0.5;
  gz00 = fract(gz00) - 0.5;
  vec4 gw00 = vec4(0.75) - abs(gx00) - abs(gy00) - abs(gz00);
  vec4 sw00 = step(gw00, vec4(0.0));
  gx00 -= sw00 * (step(0.0, gx00) - 0.5);
  gy00 -= sw00 * (step(0.0, gy00) - 0.5);

  vec4 gx01 = ixy01 / 7.0;
  vec4 gy01 = floor(gx01) / 7.0;
  vec4 gz01 = floor(gy01) / 6.0;
  gx01 = fract(gx01) - 0.5;
  gy01 = fract(gy01) - 0.5;
  gz01 = fract(gz01) - 0.5;
  vec4 gw01 = vec4(0.75) - abs(gx01) - abs(gy01) - abs(gz01);
  vec4 sw01 = step(gw01, vec4(0.0));
  gx01 -= sw01 * (step(0.0, gx01) - 0.5);
  gy01 -= sw01 * (step(0.0, gy01) - 0.5);

  vec4 gx10 = ixy10 / 7.0;
  vec4 gy10 = floor(gx10) / 7.0;
  vec4 gz10 = floor(gy10) / 6.0;
  gx10 = fract(gx10) - 0.5;
  gy10 = fract(gy10) - 0.5;
  gz10 = fract(gz10) - 0.5;
  vec4 gw10 = vec4(0.75) - abs(gx10) - abs(gy10) - abs(gz10);
  vec4 sw10 = step(gw10, vec4(0.0));
  gx10 -= sw10 * (step(0.0, gx10) - 0.5);
  gy10 -= sw10 * (step(0.0, gy10) - 0.5);

  vec4 gx11 = ixy11 / 7.0;
  vec4 gy11 = floor(gx11) / 7.0;
  vec4 gz11 = floor(gy11) / 6.0;
  gx11 = fract(gx11) - 0.5;
  gy11 = fract(gy11) - 0.5;
  gz11 = fract(gz11) - 0.5;
  vec4 gw11 = vec4(0.75) - abs(gx11) - abs(gy11) - abs(gz11);
  vec4 sw11 = step(gw11, vec4(0.0));
  gx11 -= sw11 * (step(0.0, gx11) - 0.5);
  gy11 -= sw11 * (step(0.0, gy11) - 0.5);

  vec4 g0000 = vec4(gx00.x,gy00.x,gz00.x,gw00.x);
  vec4 g1000 = vec4(gx00.y,gy00.y,gz00.y,gw00.y);
  vec4 g0100 = vec4(gx00.z,gy00.z,gz00.z,gw00.z);
  vec4 g1100 = vec4(gx00.w,gy00.w,gz00.w,gw00.w);
  vec4 g0010 = vec4(gx10.x,gy10.x,gz10.x,gw10.x);
  vec4 g1010 = vec4(gx10.y,gy10.y,gz10.y,gw10.y);
  vec4 g0110 = vec4(gx10.z,gy10.z,gz10.z,gw10.z);
  vec4 g1110 = vec4(gx10.w,gy10.w,gz10.w,gw10.w);
  vec4 g0001 = vec4(gx01.x,gy01.x,gz01.x,gw01.x);
  vec4 g1001 = vec4(gx01.y,gy01.y,gz01.y,gw01.y);
  vec4 g0101 = vec4(gx01.z,gy01.z,gz01.z,gw01.z);
  vec4 g1101 = vec4(gx01.w,gy01.w,gz01.w,gw01.w);
  vec4 g0011 = vec4(gx11.x,gy11.x,gz11.x,gw11.x);
  vec4 g1011 = vec4(gx11.y,gy11.y,gz11.y,gw11.y);
  vec4 g0111 = vec4(gx11.z,gy11.z,gz11.z,gw11.z);
  vec4 g1111 = vec4(gx11.w,gy11.w,gz11.w,gw11.w);

  vec4 norm00 = taylorInvSqrt(vec4(dot(g0000, g0000), dot(g0100, g0100), dot(g1000, g1000), dot(g1100, g1100)));
  g0000 *= norm00.x;
  g0100 *= norm00.y;
  g1000 *= norm00.z;
  g1100 *= norm00.w;

  vec4 norm01 = taylorInvSqrt(vec4(dot(g0001, g0001), dot(g0101, g0101), dot(g1001, g1001), dot(g1101, g1101)));
  g0001 *= norm01.x;
  g0101 *= norm01.y;
  g1001 *= norm01.z;
  g1101 *= norm01.w;

  vec4 norm10 = taylorInvSqrt(vec4(dot(g0010, g0010), dot(g0110, g0110), dot(g1010, g1010), dot(g1110, g1110)));
  g0010 *= norm10.x;
  g0110 *= norm10.y;
  g1010 *= norm10.z;
  g1110 *= norm10.w;

  vec4 norm11 = taylorInvSqrt(vec4(dot(g0011, g0011), dot(g0111, g0111), dot(g1011, g1011), dot(g1111, g1111)));
  g0011 *= norm11.x;
  g0111 *= norm11.y;
  g1011 *= norm11.z;
  g1111 *= norm11.w;

  float n0000 = dot(g0000, Pf0);
  float n1000 = dot(g1000, vec4(Pf1.x, Pf0.yzw));
  float n0100 = dot(g0100, vec4(Pf0.x, Pf1.y, Pf0.zw));
  float n1100 = dot(g1100, vec4(Pf1.xy, Pf0.zw));
  float n0010 = dot(g0010, vec4(Pf0.xy, Pf1.z, Pf0.w));
  float n1010 = dot(g1010, vec4(Pf1.x, Pf0.y, Pf1.z, Pf0.w));
  float n0110 = dot(g0110, vec4(Pf0.x, Pf1.yz, Pf0.w));
  float n1110 = dot(g1110, vec4(Pf1.xyz, Pf0.w));
  float n0001 = dot(g0001, vec4(Pf0.xyz, Pf1.w));
  float n1001 = dot(g1001, vec4(Pf1.x, Pf0.yz, Pf1.w));
  float n0101 = dot(g0101, vec4(Pf0.x, Pf1.y, Pf0.z, Pf1.w));
  float n1101 = dot(g1101, vec4(Pf1.xy, Pf0.z, Pf1.w));
  float n0011 = dot(g0011, vec4(Pf0.xy, Pf1.zw));
  float n1011 = dot(g1011, vec4(Pf1.x, Pf0.y, Pf1.zw));
  float n0111 = dot(g0111, vec4(Pf0.x, Pf1.yzw));
  float n1111 = dot(g1111, Pf1);

  vec4 fade_xyzw = fade(Pf0);
  vec4 n_0w = mix(vec4(n0000, n1000, n0100, n1100), vec4(n0001, n1001, n0101, n1101), fade_xyzw.w);
  vec4 n_1w = mix(vec4(n0010, n1010, n0110, n1110), vec4(n0011, n1011, n0111, n1111), fade_xyzw.w);
  vec4 n_zw = mix(n_0w, n_1w, fade_xyzw.z);
  vec2 n_yzw = mix(n_zw.xy, n_zw.zw, fade_xyzw.y);
  float n_xyzw = mix(n_yzw.x, n_yzw.y, fade_xyzw.x);
  return 2.2 * n_xyzw;
}



float composedNoise(vec3 coefficients, vec3 frequencies, vec4 P){
    if (fog_selector == 5){
        return coefficients.x* cnoise(frequencies.x*P)+ coefficients.y* cnoise(frequencies.y*P)+ coefficients.z* cnoise(frequencies.z*P);
    }
    if (fog_selector == 6){
        return coefficients.x* snoise(frequencies.x*P)+ coefficients.y* snoise(frequencies.y*P)+ coefficients.z* snoise(frequencies.z*P);
    }
}

//----------------------------------------------------------------------------------

float distance(vec3 v){
    return sqrt(pow(v.x,2)+pow(v.y,2)+pow(v.z,2));
}

bool domain(vec3 particle){
    return particle.x*particle.x+ particle.z*particle.z + particle .y*particle.y<70;
       
}

float volume_density_perlin(vec3 particle){
    if (domain(particle)){
        return max(perlin_noise(particle),0)* 5.0f;
    }
    return 0.0f;
}

float volume_density_perlin_4d(vec3 particle){
    if (domain(particle)){
        vec4 time_particle = vec4( particle.x, particle.y, particle.z, v2f_fogtime);

        return max(composedNoise(vec3(1.0,1.0,0.0),vec3(1.0,0.5,2.0),time_particle),0)*5.0f;
    }
    return 0.0f;
}

float linear_fog_density(vec3 particle){

    return min(distance(particle)/20,1);
}
float exponential_fog_density(vec3 particle){
    float density = 0.3f;
    return min(1-1/exp(distance(particle)*density), 1);
}
float uniforme_density_function(vec3 particle){
    //uniform density
    if (domain(particle)){
        return 0.1f;
    }
    return 0.0f;

}


//vec3 -> color seen through that ray
vec3 linear_integration_world_space_animated(vec3 ray, vec3 color_phong, vec3 color_fog){

    float frag_eye_distance = distance(v2f_frageyepos);
    float partial_distance= frag_eye_distance;
    //float max_sum = 100;
    vec3 max_color = vec3(100,100,100);
    float step = 0.02f;
    //float partial_sum=0.0f;
    vec3 partial_color = color_phong;
    vec3 light_contribution = vec3(0.0f,0.0f,0.0f);

    vec3 partial_ray = v2f_fragworldpos;
    
    while(partial_distance >0.0f){
        vec3 light_contribution = vec3(0.0f,0.0f,0.0f);

        
        vec3 light_vector = normalize(-partial_ray+v2f_light);
        vec3 normal_vector = normalize(-partial_ray + v2f_eye_world_pos);
        float cosT = 1;
        //dot(light_vector,normal_vector);
        
        if(cosT > 0){
            light_contribution = color_fog*cosT*sunlight;
        } 
            

        float density = 0.0f;
        if(fog_selector == 1) {
            density = uniforme_density_function( partial_ray);
        }
        if(fog_selector == 2) {
            density = linear_fog_density( partial_ray);
        }
        if (fog_selector == 3){
            density = exponential_fog_density(partial_ray);
        }
        if (fog_selector == 4){
            density = volume_density_perlin(partial_ray);
        }
        if (fog_selector >= 5) {
            density = volume_density_perlin_4d( partial_ray );
        }
        
        
        
        
        
        partial_distance -= step;
        
        partial_ray = v2f_fragworldpos + (frag_eye_distance-partial_distance)/frag_eye_distance * (v2f_eye_world_pos-v2f_fragworldpos);

        
        float tau = 0.5;
        partial_color *= exp(-density*step*tau);

        partial_color += light_contribution*step*density;
    }
    return (max(min(partial_color,255),0));   
}



void main()
{
    
    vec3 color = vec3(0.0,0.0,0.0);
    float AMBIENT = 0.2;
    vec3 LIGHT_INTENSITY = sunlight;
    color += AMBIENT * texture(tex, v2f_texcoord).rgb;

    vec3 fog_color= vec3(0.5,0.5,0.5)* LIGHT_INTENSITY;

    // normalize the previously computed vectors
    vec3 norm_ = normalize(v2f_normal);
    vec3 light_norm_ = normalize(v2f_light);

    //vec3 view_norm_ = normalize(v2f_view);
    vec3 view_norm_ = normalize(-v2f_view);

    // computation of the reflected angle 
    vec3 v2f_reflect = reflect(light_norm_, norm_);
    //vec3 v2f_reflect = 2.0 * norm_ *dot (light_norm_, norm_) -light_norm_;
    vec3 reflect_norm_ = normalize(v2f_reflect);

    // computation of the angle 
    float cosT = dot(norm_, light_norm_);
    float cosA = dot(reflect_norm_, view_norm_);

    // checking the condition to add the difuse lighting
    if(cosT > 0) {
        color += LIGHT_INTENSITY * texture(tex, v2f_texcoord).rgb * cosT;
         // checking the conditon to add the shinning lighting 
        if(cosA > 0){
            color += LIGHT_INTENSITY * texture(tex, v2f_texcoord).rgb * pow(cosA, shininess);
        }
    }

    vec3 color_final = linear_integration_world_space_animated(v2f_fragworldpos, color, fog_color);
    
        
    
    // add required alpha value
    f_color = vec4(color_final, 1.0);
}




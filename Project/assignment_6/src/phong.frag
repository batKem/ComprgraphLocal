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

out vec4 f_color;

uniform sampler2D tex;
uniform bool greyscale;

const float shininess = 8.0;
const vec3  sunlight = vec3(1.0, 0.941, 0.898);

void main()
{
    /**
    *  Implement the Phong shading model (like in the 1st exercise) by using the passed
    *  variables and write the resulting color to `color`.
    *  `tex` should be used as material parameter for ambient, diffuse and specular lighting.
    * Hints:
    * - The texture(texture, 2d_position) returns a 4-vector (rgba). You can use
    * `texture(...).r` to get just the red component or `texture(...).rgb` to get a vec3 color
    * value
     */

    vec3 color = vec3(0.0,0.0,0.0);
    float AMBIENT = 0.2;
    vec3 LIGHT_INTENSITY = sunlight;
    color += AMBIENT * texture(tex, v2f_texcoord).rgb;

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


    // convert RGB color to YUV color and use only the luminance
    if (greyscale) color = vec3(0.299*color.r+0.587*color.g+0.114*color.b);

    // add required alpha value
    f_color = vec4(color, 1.0);
}

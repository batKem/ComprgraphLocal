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

uniform sampler2D day_texture;
uniform sampler2D night_texture;
uniform sampler2D cloud_texture;
uniform sampler2D gloss_texture;
uniform bool greyscale;

const float shininess = 20.0;
const vec3  sunlight = vec3(1.0, 0.941, 0.898);

void main()
{
	vec4 day_text_=texture(day_texture, v2f_texcoord);
	vec4 night_text_=texture(night_texture, v2f_texcoord);
	vec4 cloud_text_ =texture(cloud_texture, v2f_texcoord);
	vec4 gloss_text_ = texture(gloss_texture, v2f_texcoord);
	float cloud_grayscale = (cloud_text_.r+ cloud_text_.g+cloud_text_.b) /3.0;
    float gloss_grayscale = (gloss_text_.r+ gloss_text_.g+gloss_text_.b) /3.0;


	vec3 day_color = vec3(0.0,0.0,0.0);
    float AMBIENT = 0.2;
    vec3 LIGHT_INTENSITY = sunlight;
    day_color += AMBIENT * LIGHT_INTENSITY* day_text_.rgb;

    // normalize the previously computed vectors
    vec3 norm_ = normalize(v2f_normal);
    vec3 light_norm_ = normalize(v2f_light);

    //vec3 view_norm_ = normalize(v2f_view);
    vec3 view_norm_ = normalize(-v2f_view);

    // computation of the reflected angle 
    vec3 v2f_reflect = -reflect(light_norm_, norm_);
    //vec3 v2f_reflect = 2.0 * norm_ *dot (light_norm_, norm_) -light_norm_;
    vec3 reflect_norm_ = normalize(v2f_reflect);

    // computation of the angle 
    float cosT = dot(norm_, light_norm_);
    float cosA = dot(reflect_norm_, view_norm_);


	vec3 cloud_color = vec3(0.0,0.0,0.0);
    cloud_color += AMBIENT * LIGHT_INTENSITY* cloud_text_.rgb;


    // checking the condition to add the difuse lighting
    if(cosT > 0) {
        day_color += LIGHT_INTENSITY * day_text_.rgb * cosT;
		cloud_color += LIGHT_INTENSITY * cloud_text_.rgb* cosT;
         // checking the conditon to add the shinning lighting 
        if(gloss_grayscale ==1.0 && cosA > 0){
            day_color +=  vec3(1.0,1.0,1.0) * pow(cosA, shininess) * (1-cloud_grayscale) ;
        }
    }

	//interpolate between day to cloud using cloudiness
	
	vec3 blended_day = cloud_grayscale*cloud_color + (1- cloud_grayscale)*day_color;

	//interpolate from night to black using cloudiness (black = 0)
	vec3 night_color = (1- cloud_grayscale)*night_text_.rgb;

    vec3 blended_color = vec3 (0,0,0);
    
    if(cosT>0.5){
        blended_color += blended_day;
    }
    else if( cosT < -0.5){
        blended_color += night_color;
    }
    else {
        blended_color += (cosT+0.5)* blended_day + (0.5-cosT)* night_color;
    }


	// convert RGB color to YUV color and use only the luminance
    if (greyscale) blended_color = vec3(0.299*blended_color.r+0.587*blended_color.g+0.114*blended_color.b);

    // add required alpha value
    f_color = vec4(blended_color, 1.0);

}

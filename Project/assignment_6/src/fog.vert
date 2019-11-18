//=============================================================================
//
//   Exercise code for the lecture "Introduction to Computer Graphics"
//     by Prof. Mario Botsch, Bielefeld University
//
//   Copyright (C) by Computer Graphics Group, Bielefeld University
//
//=============================================================================

#version 140
#extension GL_ARB_explicit_attrib_location : enable

layout (location = 0) in vec4 v_position;
layout (location = 1) in vec3 v_normal;
layout (location = 2) in vec2 v_texcoord;

out vec2 v2f_texcoord;
out vec3 v2f_normal;
out vec3 v2f_light;
out vec3 v2f_view;
out vec3 v2f_frageyepos;
out vec3 v2f_eye_world_pos;
out vec3 v2f_fragworldpos;
out float v2f_fogtime;


uniform vec4 eye_world_pos;
uniform mat4 obj_to_world_matrix; // object to world
uniform mat4 modelview_projection_matrix; // object to eye space to screen space - P WtC OtW
uniform mat4 modelview_matrix; // object to eye space
uniform mat3 normal_matrix; // only rotates the normal 
uniform vec4 light_position; //in eye space coordinates already
uniform float fogtime;



void main()
{
    /** \todo Setup all outgoing variables so that you can compute in the fragmend shader
      the phong lighting. You will need to setup all the uniforms listed above, before you
      can start coding this shader.

      Hint: Compute the vertex position, normal and light_position in eye space.
      Hint: Write the final vertex position to gl_Position
    */
  
  v2f_fogtime = fogtime;
  v2f_texcoord = v_texcoord;
  v2f_eye_world_pos = vec3(eye_world_pos);
  //v2f_eye_world_pos = vec3(obj_to_world_matrix*eye_world_pos)/(obj_to_world_matrix *eye_world_pos)[3];
  v2f_fragworldpos = vec3(obj_to_world_matrix*v_position)/(obj_to_world_matrix * v_position)[3];
  v2f_frageyepos = vec3( modelview_matrix * v_position)/(modelview_matrix * v_position)[3];
  // normal in eye space 
  v2f_normal = normal_matrix * v_normal;

  // vertex in eye space 
  v2f_view = normalize( vec3( modelview_matrix * v_position)/(modelview_matrix * v_position)[3]);

  // Light direction in eye Space 
  v2f_light = normalize( vec3(light_position - modelview_matrix * v_position));

	// vertex in screen sapce 
	gl_Position = modelview_projection_matrix  * v_position;

}

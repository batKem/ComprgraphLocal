//=============================================================================
//
//   Exercise code for the lecture "Introduction to Computer Graphics"
//     by Prof. Mario Botsch, Bielefeld University
//
//   Copyright (C) by Computer Graphics Group, Bielefeld University
//
//=============================================================================

#include "solar_viewer.h"
#include "glmath.h"
#include <stdlib.h>     /* srand, rand */
#include <time.h>       /* time */
#include <array>
#include <iostream>
#include <stdio.h>

float fogtime = 0.0f;
float model_size = 0.02f;
FILE* ffmpeg;
bool is_writing;
int fog_selector;

//=============================================================================


Solar_viewer::Solar_viewer(const char* _title, int _width, int _height)
    : GLFW_window(_title, 1280, 720),
      unit_sphere_(50), //level of tesselation

      /** Use the following for better planet distances/sizes (but still not realistic)
      * To get a true-to-scale solar system, planets would be 20x smaller, and their distance to the sun would be ~11x larger
      * For example r_mercury/r_sun = 0.0034 and distance_mercury_to_sun/r_sun = 33.3
      **/
      //  sun_    (0.0f,              2.0f*(float)(M_PI)/26.0f,   1.0f,    0.0f),
      //  mercury_(2.0f*(float)(M_PI)/116.0f,  2.0f*(float)(M_PI)/58.5f,   0.068f, -3.1f),
      //  venus_  (2.0f*(float)(M_PI)/225.0f,  2.0f*(float)(M_PI)/243.0f,  0.174f,   -7.2f),
      //  earth_  (2.0f*(float)(M_PI)/365.0f,  2.0f*(float)(M_PI),        0.182f,   -9.8f),
      //  moon_   (2.0f*(float)(M_PI)/27.0f,   0.0f,  0.048f,   -0.5f),
      //  mars_   (2.0f*(float)(M_PI)/687.0f,  2.0f*(float)(M_PI)*24.0f/25.0f, 0.098f,-13.8f),
      //  stars_  (0.0f, 0.0f, 30.0f, 0.0f)

      // Even more unrealistic placement/sizing for nicer visualization.
      sun_    (0.0,              2.0*M_PI/26.0,   1.0f,    0.0f),
      mercury_(2.0*M_PI/116.0f,  2.0*M_PI/58.5,   0.075f, -1.4f),
      venus_  (2.0*M_PI/225.0f,  2.0*M_PI/243.0,  0.2f,   -2.2f),
      earth_  (2.0*M_PI/365.0f,  2.0*M_PI,        0.25,   -3.3f),
      moon_   (2.0*M_PI/27.0f,   0.0,  0.04,   -0.4f),
      mars_   (2.0*M_PI/687.0f,  2.0*M_PI*24.0/25.0, 0.15,-5.0f),
      stars_  (0.0, 0.0, 21.0, 0.0)
{
    // start animation
    timer_active_ = true;
    time_step_ = 1.0f/24.0f; // one hour

    // rendering parameters
    greyscale_     = false;
    fovy_ = 45;
    near_ = 0.01f;
    far_  = 20;

    // initial viewing setup
    planet_to_look_at_ = &earth_;
    x_angle_ = 0.0f;
    y_angle_ = 0.0f;
    dist_factor_ = 4.5f;

    ship_.pos_ = planet_to_look_at_->pos_ - vec4(0.0f, 0.0f, dist_factor_*planet_to_look_at_->radius_, 0.0f);
    ship_.direction_ = vec4(0.0f, 0.0f, 1.0f,0.0f);
    in_ship_ = false;

    srand((unsigned int)time(NULL));
	
}

//-----------------------------------------------------------------------------

void
Solar_viewer::
keyboard(int key, int scancode, int action, int mods)
{
    if (action == GLFW_PRESS || action == GLFW_REPEAT)
    {
        // Change view between the various bodies with keys 1..6
        if ((key >= GLFW_KEY_1) && (key <= GLFW_KEY_6)) {
            std::array<const Planet *, 6> bodies = { &sun_, &mercury_, &venus_, &earth_, &moon_, &mars_};
            in_ship_ = false;
            planet_to_look_at_ = bodies.at(key - GLFW_KEY_1);
        }
        switch (key)
        {
            // Key 7 switches to viewing the ship.
            case GLFW_KEY_7:
            {
                planet_to_look_at_ = NULL;
                in_ship_ = true;
                break;
            }

            // assi 5
            case GLFW_KEY_8: {
				dist_factor_ = std::min(20.0f, std::max(2.5f, dist_factor_ - 0.5f));
				break;
			}
			case GLFW_KEY_9: {
				dist_factor_ = std::min(20.0f, std::max(2.5f, dist_factor_ + 0.5f));
				break;
			}

            case GLFW_KEY_R:
            {
                randomize_planets();
                break;
            }

            case GLFW_KEY_G:
            {
				if (is_writing) {
					is_writing = false;
					_pclose(ffmpeg);
					std::cout << "Stoped rendering video" << std::endl;
				}
				else {
					is_writing = true;
					out_video(&(ffmpeg));
					std::cout << "Started renderin video" << std::endl;
				}
                break;
            }
			case GLFW_KEY_F:
			{
				fog_selector = (fog_selector + 1) % 7;
				break;
			}

            case GLFW_KEY_W:
            {
                if (in_ship_)
                    ship_.accelerate(0.001f);
                break;
            }
            case GLFW_KEY_S:
            {
                if (in_ship_)
                    ship_.accelerate(-0.001f);
                break;
            }
            case GLFW_KEY_A:
            {
                if (in_ship_)
                    ship_.accelerate_angular(0.02f);
                break;
            }
            case GLFW_KEY_D:
            {
                if (in_ship_)
                    ship_.accelerate_angular(-0.02f);
                break;
            }

            case GLFW_KEY_C:
                curve_display_mode_ = CurveDisplayMode((int(curve_display_mode_) + 1) % int(CURVE_SHOW_NUM_MODES));
                break;
            case GLFW_KEY_T:
                ship_path_frame_.toggleParallelTransport();
                std::cout << (ship_path_frame_.usingParallelTransport() ? "enabled" : "diabled") << " parallel transport" << std::endl;
                break;

            case GLFW_KEY_LEFT:
            {
                y_angle_ -= 10.0;
                break;
            }

            case GLFW_KEY_RIGHT:
            {
                y_angle_ += 10.0;
                break;
            }

            case GLFW_KEY_DOWN:
            {
                x_angle_ += 10.0;
                break;
            }

            case GLFW_KEY_UP:
            {
                x_angle_ -= 10.0;
                break;
            }

            case GLFW_KEY_SPACE:
            {
                timer_active_ = !timer_active_;
                break;
            }

            case GLFW_KEY_P:
            case GLFW_KEY_KP_ADD:
            case GLFW_KEY_EQUAL:
            {
                time_step_ *= 2.0f;
                std::cout << "Time step: " << time_step_ << " days\n";
                break;
            }

            case GLFW_KEY_M:
            case GLFW_KEY_KP_SUBTRACT:
            case GLFW_KEY_MINUS:
            {
                time_step_ *= 0.5f;
                std::cout << "Time step: " << time_step_ << " days\n";
                break;
            }

            case GLFW_KEY_ESCAPE:
            {
                glfwSetWindowShouldClose(window_, GL_TRUE);
                break;
            }
        }
    }
}

// Update the current positions of the celestial bodies based their angular distance
// around their orbits. This position is needed to set up the camera in the scene
// (see Solar_viewer::paint)
void Solar_viewer::update_body_positions() {
    
}

//-----------------------------------------------------------------------------


void Solar_viewer::timer()
{
    if (timer_active_) {
		fogtime += time_step_;

        update_body_positions();

        ship_.update_ship();

        // Desired ship speed (in units of Euclidean distance per animation
        // frame, not curve parameter distance). This is the (constant)
        // Euclidean step length we want the ship to make during each time step.
        const float ship_speed = 0.01;
        ship_path_param_ = 0;
        if (ship_path_param_ >= 1) { ship_path_param_ = 0; }
        vec3 tangent = ship_path_.tangent(ship_path_param_);
        ship_path_frame_.alignTo(tangent);
    }
}


//-----------------------------------------------------------------------------


void Solar_viewer::resize(int _width, int _height)
{
    width_  = 1280;
    height_ = 720;
    glViewport(0, 0, width_, height_);
}

//-----------------------------------------------------------------------------


void Solar_viewer::initialize()
{
    // set initial state
    glClearColor(1,1,1,0);
    glEnable(GL_DEPTH_TEST);

    // Allocate textures

    stars_  .tex_.init(GL_TEXTURE0, GL_TEXTURE_2D, GL_LINEAR_MIPMAP_LINEAR, GL_LINEAR, GL_REPEAT);
	forest_.tex_.init(GL_TEXTURE0, GL_TEXTURE_2D, GL_LINEAR_MIPMAP_LINEAR, GL_LINEAR, GL_REPEAT);
	terrain_.tex_.init(GL_TEXTURE0, GL_TEXTURE_2D, GL_LINEAR_MIPMAP_LINEAR, GL_LINEAR, GL_REPEAT);


    // Load/generate textures

	stars_.tex_.loadPNG(TEXTURE_PATH "/neptune.png");
	forest_.load_model(TEXTURE_PATH "/forestscene.off");

	forest_.tex_.loadPNG(TEXTURE_PATH "/ship.png");
	forest_.radius_ = model_size;
	//terrain_.load_model(TEXTURE_PATH "/forestparticle.off");

	//terrain_.tex_.loadPNG(TEXTURE_PATH "/terrain.png");
	//terrain_.radius_ = model_size;
    //sunglow_.tex_.createSunBillboardTexture();

    // setup shaders
   
	fog_shader_.load(SHADER_PATH "/fog.vert", SHADER_PATH "/fog.frag");
	fog_selector = 0;
	
}
//-----------------------------------------------------------------------------


void Solar_viewer::paint()
{
    // clear framebuffer and depth buffer first
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

    // \todo Paste your viewing/navigation code from assignment 5 here.
    vec4     eye = vec4(0,0,0,1.0);
    vec4  center = sun_.pos_;
    vec4      up = vec4(0,1,0,0);
    float radius = sun_.radius_;

    if(in_ship_){
        center = ship_.pos_;
		eye = mat4::translate(vec3(0, 0, ship_.radius_ * dist_factor_))*eye;
		eye = mat4::rotate_x(-15)*eye;
		eye = mat4::rotate_y(y_angle_ + ship_.angle_ + 180)*eye;
		eye = mat4::translate(center)*eye;
    } else {
        center = planet_to_look_at_->pos_;
        eye = mat4::translate(vec3(0,0, planet_to_look_at_->radius_  * dist_factor_))*eye;
        eye = mat4::rotate_x(x_angle_)*eye;
        eye = mat4::rotate_y(y_angle_)*eye;
        eye = mat4::translate(center)*eye;
    }
    mat4    view = mat4::look_at(vec3(eye), vec3(center), vec3(up));


	//assi 6
    billboard_x_angle_ = billboard_y_angle_ = 0.0f;
    vec3 normal = normalize(vec3(eye)-vec3(sun_.pos_));
    billboard_x_angle_ = -asin(normal[1])* 180 / M_PI;   
    billboard_y_angle_ = atan2 (normal[0],normal[2])* 180 / M_PI;


    mat4 projection = mat4::perspective(fovy_, (float)width_/(float)height_, near_, far_);
    draw_scene(projection, view, eye);
	get_frame_into_video(width_, height_, ffmpeg);
}


//-----------------------------------------------------------------------------


void Solar_viewer::draw_scene(mat4& _projection, mat4& _view, vec4 eye)
{
    switch (curve_display_mode_) {
        case CURVE_SHOW_PATH_FRAME:
            ship_path_frame_.draw(solid_color_shader_, _projection * _view, ship_path_(ship_path_param_));
        case CURVE_SHOW_PATH_CP:
            solid_color_shader_.use();
            solid_color_shader_.set_uniform("modelview_projection_matrix", _projection * _view);
            solid_color_shader_.set_uniform("color", vec4(0.8, 0.8, 0.8, 1.0));
            ship_path_cp_renderer_.draw();
        case CURVE_SHOW_PATH:
            solid_color_shader_.use();
            solid_color_shader_.set_uniform("modelview_projection_matrix", _projection * _view);
            solid_color_shader_.set_uniform("color", vec4(1.0, 0.0, 0.0, 1.0));
            ship_path_renderer_.draw();
        default:
            break;
    }

    // the matrices we need: model, modelview, modelview-projection, normal
    mat4 m_matrix;
    mat4 mv_matrix;
    mat4 mvp_matrix;
    mat3 n_matrix;

    // the sun is centered at the origin and -- for lighting -- considered to be a point, so that is the light position in world coordinates
    vec4 w_light = vec4(15, 10, 0, 1.0); //in world coordinates
    // convert light into camera coordinates
    vec4 e_light = _view * w_light;

    static float sun_animation_time = 0;
    if (timer_active_) sun_animation_time += 0.01f;
	
	
	m_matrix = mat4::rotate_y(stars_.angle_self_) * mat4::scale(stars_.radius_);
	mv_matrix = _view*m_matrix;
    n_matrix = transpose(inverse(mv_matrix));
	mvp_matrix = _projection*mv_matrix;
	fog_shader_.use();
	fog_shader_.set_uniform("modelview_projection_matrix", mvp_matrix);
	fog_shader_.set_uniform("normal_matrix", n_matrix);
	fog_shader_.set_uniform("obj_to_world_matrix", m_matrix);
	fog_shader_.set_uniform("eye_world_pos", eye);
	fog_shader_.set_uniform("fogtime", fogtime);
	fog_shader_.set_uniform("modelview_matrix", mv_matrix);
	fog_shader_.set_uniform("light_position", e_light);
	fog_shader_.set_uniform("tex", 0);
	fog_shader_.set_uniform("fog_selector", fog_selector);
    
	stars_.tex_.bind();
	unit_sphere_.draw();
	
	//forest
	m_matrix = mat4::translate(forest_.pos_)*mat4::scale(forest_.radius_);
	mv_matrix = _view * m_matrix;
	mvp_matrix = _projection * mv_matrix;
	fog_shader_.use();
	fog_shader_.set_uniform("modelview_projection_matrix", mvp_matrix);
	fog_shader_.set_uniform("normal_matrix", n_matrix);
	fog_shader_.set_uniform("obj_to_world_matrix", m_matrix);
	fog_shader_.set_uniform("eye_world_pos", eye);
	fog_shader_.set_uniform("fogtime", fogtime);
	fog_shader_.set_uniform("modelview_matrix", mv_matrix);
	fog_shader_.set_uniform("light_position", e_light);
	fog_shader_.set_uniform("tex", 0);
	fog_shader_.set_uniform("fog_selector", fog_selector);

	forest_.tex_.bind();
	forest_.draw();
	//terrain
	/*
	m_matrix = mat4::translate(terrain_.pos_) * mat4::scale(terrain_.radius_);
	mv_matrix = _view * m_matrix;
	mvp_matrix = _projection * mv_matrix;
	fog_shader_.use();
	fog_shader_.set_uniform("modelview_projection_matrix", mvp_matrix);
	fog_shader_.set_uniform("normal_matrix", n_matrix);
	fog_shader_.set_uniform("obj_to_world_matrix", m_matrix);
	fog_shader_.set_uniform("eye_world_pos", eye);
	fog_shader_.set_uniform("fogtime", fogtime);
	fog_shader_.set_uniform("modelview_matrix", mv_matrix);
	fog_shader_.set_uniform("light_position", e_light);
	fog_shader_.set_uniform("tex", 0);
	terrain_.tex_.bind();
	terrain_.draw();*/
	

	
    // check for OpenGL errors
    glCheckError();
	

	
}

void Solar_viewer::randomize_planets()
{
    std::cout << "Randomizing planets..." << std::endl;
    float temp_dt = time_step_;
    time_step_ = (float)(rand()%20000);
    timer();


    time_step_ = temp_dt;
}

void Solar_viewer::get_frame_into_video(int w, int h,FILE* ffmpeg)
{
	if (is_writing) {
		int* buffer = new int[w * h];
		glReadBuffer(GL_FRONT);
		glReadPixels(0, 0, w, h, GL_RGBA, GL_UNSIGNED_BYTE, buffer);
		try {
			fwrite(buffer, sizeof(int), w * h, ffmpeg);
		}
		catch (int e) {
			_pclose(ffmpeg);
		}
	}
}

void Solar_viewer::out_video(FILE** ffmpeg)
{
	const char* cmd = "ffmpeg -r 60 -f rawvideo -pix_fmt rgba -s 1280x720 -i - "
		"-threads 0 -preset fast -y -pix_fmt yuv420p -crf 21 -vf vflip output.mp4";
	*ffmpeg = _popen(cmd, "wb");
	is_writing = true;
}


//=============================================================================

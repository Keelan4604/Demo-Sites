<?php
/**
 * EcoPro USA theme functions.
 */

if (! defined('ABSPATH')) {
    exit;
}

require_once get_template_directory() . '/inc/theme-helpers.php';

function ecopro_setup() {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', array('search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script'));
    add_theme_support('custom-logo');
    add_theme_support('menus');

    register_nav_menus(array(
        'primary' => __('Primary Menu', 'ecopro-usa'),
        'footer_company' => __('Footer Company Menu', 'ecopro-usa'),
        'footer_products' => __('Footer Products Menu', 'ecopro-usa'),
    ));
}
add_action('after_setup_theme', 'ecopro_setup');

function ecopro_enqueue_assets() {
    wp_enqueue_style('ecopro-google-fonts', 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:wght@700;800&display=swap', array(), null);
    wp_enqueue_style('ecopro-main', get_template_directory_uri() . '/assets/css/main.css', array(), filemtime(get_template_directory() . '/assets/css/main.css'));
    wp_enqueue_script('ecopro-main', get_template_directory_uri() . '/assets/js/main.js', array(), filemtime(get_template_directory() . '/assets/js/main.js'), true);
}
add_action('wp_enqueue_scripts', 'ecopro_enqueue_assets');

function ecopro_register_home_fields() {
    if (! function_exists('register_post_meta')) {
        return;
    }

    $fields = array(
        'hero_eyebrow', 'hero_headline', 'hero_accent', 'hero_subtext', 'hero_primary_text', 'hero_primary_url', 'hero_secondary_text', 'hero_secondary_url',
        'stat_1_number', 'stat_1_label', 'stat_1_prefix', 'stat_1_suffix', 'stat_2_number', 'stat_2_label', 'stat_2_prefix', 'stat_2_suffix', 'stat_3_number', 'stat_3_label', 'stat_3_prefix', 'stat_3_suffix',
        'about_eyebrow', 'about_title', 'about_subtext',
        'why_eyebrow', 'why_title', 'why_text', 'why_button_text', 'why_button_url',
        'products_eyebrow', 'products_title', 'products_subtext',
        'results_eyebrow', 'results_title', 'results_subtext',
        'trusted_eyebrow', 'trusted_title',
        'cta_title', 'cta_text', 'cta_primary_text', 'cta_primary_url', 'cta_secondary_text', 'cta_secondary_url',
        'footer_tagline', 'footer_phone', 'footer_email', 'footer_address',
        'hero_slide_1', 'hero_slide_2', 'hero_slide_3', 'why_background'
    );

    foreach ($fields as $field) {
        register_post_meta('page', $field, array(
            'show_in_rest' => true,
            'single'       => true,
            'type'         => 'string',
            'auth_callback' => function () {
                return current_user_can('edit_pages');
            },
        ));
    }
}
add_action('init', 'ecopro_register_home_fields');

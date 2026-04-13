<?php
if (! defined('ABSPATH')) {
    exit;
}

function ecopro_meta($key, $default = '', $post_id = null) {
    $post_id = $post_id ?: get_the_ID();
    if (! $post_id) {
        return $default;
    }

    $value = get_post_meta($post_id, $key, true);
    return ($value !== '' && $value !== null) ? $value : $default;
}

function ecopro_image_url($value, $default = '') {
    if (! $value) {
        return $default;
    }

    if (is_numeric($value)) {
        $image = wp_get_attachment_image_url((int) $value, 'full');
        return $image ?: $default;
    }

    return esc_url($value);
}

function ecopro_render_menu_or_fallback($location, $fallback_items = array(), $menu_class = '') {
    if (has_nav_menu($location)) {
        wp_nav_menu(array(
            'theme_location' => $location,
            'container'      => false,
            'menu_class'     => $menu_class,
            'fallback_cb'    => false,
        ));
        return;
    }

    if (empty($fallback_items)) {
        return;
    }

    echo '<ul class="' . esc_attr($menu_class) . '">';
    foreach ($fallback_items as $item) {
        echo '<li><a href="' . esc_url($item['url']) . '">' . esc_html($item['label']) . '</a></li>';
    }
    echo '</ul>';
}

<?php if (! defined('ABSPATH')) { exit; } ?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<header class="site-header" id="site-header">
    <div class="container header-inner">
        <a href="<?php echo esc_url(home_url('/')); ?>" class="logo" aria-label="EcoPro USA Home">
            <?php
            $logo = get_custom_logo();
            if ($logo) {
                echo $logo; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
            } else {
                ?>
                <img src="<?php echo esc_url(get_template_directory_uri() . '/assets/images/eco-pro-logo-300x73.png'); ?>" alt="<?php echo esc_attr(get_bloginfo('name')); ?>" width="180" height="44">
                <?php
            }
            ?>
        </a>
        <nav class="main-nav" id="main-nav" aria-label="Main navigation">
            <?php
            ecopro_render_menu_or_fallback('primary', array(
                array('label' => 'Home', 'url' => '#hero'),
                array('label' => 'About', 'url' => '#about'),
                array('label' => 'Products', 'url' => '#products'),
                array('label' => 'Results', 'url' => '#results'),
                array('label' => 'Contact', 'url' => '#contact'),
            ), 'nav-list');
            ?>
        </nav>
        <div class="header-actions">
            <a href="#contact" class="btn btn-primary btn-sm">Get a Quote</a>
            <button class="mobile-toggle" id="mobile-toggle" aria-label="Toggle menu" aria-expanded="false">
                <span class="hamburger"></span>
            </button>
        </div>
    </div>
</header>

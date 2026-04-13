<?php
if (! defined('ABSPATH')) {
    exit;
}
get_header();
?>
<main class="section" style="padding-top: calc(var(--header-height) + 3rem); min-height: 60vh;">
    <div class="container">
        <?php if (have_posts()) : while (have_posts()) : the_post(); ?>
            <article <?php post_class(); ?>>
                <header class="section-header" style="text-align:left; margin-bottom:2rem;">
                    <h1 class="section-title"><?php the_title(); ?></h1>
                </header>
                <div class="entry-content">
                    <?php the_content(); ?>
                </div>
            </article>
        <?php endwhile; endif; ?>
    </div>
</main>
<?php get_footer(); ?>

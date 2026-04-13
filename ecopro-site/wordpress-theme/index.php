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
                    <h2 class="section-title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
                </header>
                <div class="entry-content">
                    <?php the_excerpt(); ?>
                </div>
            </article>
        <?php endwhile; else : ?>
            <p>No content found.</p>
        <?php endif; ?>
    </div>
</main>
<?php get_footer(); ?>

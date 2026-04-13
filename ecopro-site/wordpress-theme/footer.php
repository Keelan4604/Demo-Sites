<?php if (! defined('ABSPATH')) { exit; } ?>
<footer class="site-footer">
    <div class="container footer-inner">
        <div class="footer-brand">
            <img src="<?php echo esc_url(get_template_directory_uri() . '/assets/images/eco-pro-logo-300x73.png'); ?>" alt="<?php echo esc_attr(get_bloginfo('name')); ?>" width="160" height="39" class="footer-logo">
            <p class="footer-tagline"><?php echo esc_html(ecopro_meta('footer_tagline', 'Independently owned and operated. Proven products for heavy equipment — made in the USA.')); ?></p>
        </div>
        <div class="footer-links">
            <div class="footer-col">
                <h4 class="footer-heading">Products</h4>
                <?php ecopro_render_menu_or_fallback('footer_products', array(
                    array('label' => 'Turbo II HD PreCleaner', 'url' => '#products'),
                    array('label' => 'Cabin Air Pressurizer', 'url' => '#products'),
                    array('label' => 'LED HD Lights', 'url' => '#products'),
                    array('label' => 'Desiccant Breathers', 'url' => '#products'),
                    array('label' => 'Metal Adapters', 'url' => '#products'),
                )); ?>
            </div>
            <div class="footer-col">
                <h4 class="footer-heading">Company</h4>
                <?php ecopro_render_menu_or_fallback('footer_company', array(
                    array('label' => 'About', 'url' => '#about'),
                    array('label' => 'Results', 'url' => '#results'),
                    array('label' => 'Contact', 'url' => '#contact'),
                )); ?>
            </div>
            <div class="footer-col">
                <h4 class="footer-heading">Contact</h4>
                <ul>
                    <li><a href="<?php echo esc_url('tel:' . preg_replace('/[^0-9+]/', '', ecopro_meta('footer_phone', '8553267762'))); ?>"><?php echo esc_html(ecopro_meta('footer_phone', '855-ECO-PRO2')); ?></a></li>
                    <li><a href="mailto:<?php echo antispambot(ecopro_meta('footer_email', 'controller@ecoprousa.com')); ?>"><?php echo esc_html(ecopro_meta('footer_email', 'controller@ecoprousa.com')); ?></a></li>
                    <li><?php echo nl2br(esc_html(ecopro_meta('footer_address', "2443 W 12th St\nTempe, AZ 85281"))); ?></li>
                </ul>
            </div>
        </div>
    </div>
    <div class="footer-bottom">
        <div class="container footer-bottom-inner">
            <p>&copy; <?php echo esc_html(date_i18n('Y')); ?> <?php bloginfo('name'); ?>. All rights reserved.</p>
            <p>Independently owned &amp; operated &bull; Made in the USA</p>
        </div>
    </div>
</footer>
<?php wp_footer(); ?>
</body>
</html>

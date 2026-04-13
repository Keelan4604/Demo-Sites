<?php
if (! defined('ABSPATH')) {
    exit;
}
get_header();

$hero_slide_1 = ecopro_image_url(ecopro_meta('hero_slide_1', 'https://ecoprousa.com/wp-content/uploads/2022/06/slide-1-bg.jpg'));
$hero_slide_2 = ecopro_image_url(ecopro_meta('hero_slide_2', 'https://ecoprousa.com/wp-content/uploads/2022/06/slidd-2-bg.jpg'));
$hero_slide_3 = ecopro_image_url(ecopro_meta('hero_slide_3', 'https://ecoprousa.com/wp-content/uploads/2022/06/slide-3-bg.jpg'));
$why_background = ecopro_image_url(ecopro_meta('why_background', 'https://ecoprousa.com/wp-content/uploads/2022/06/our-products.jpg'));
?>
<section class="hero" id="hero">
    <div class="hero-bg">
        <div class="hero-slide active" style="background-image:url('<?php echo esc_url($hero_slide_1); ?>')"></div>
        <div class="hero-slide" style="background-image:url('<?php echo esc_url($hero_slide_2); ?>')"></div>
        <div class="hero-slide" style="background-image:url('<?php echo esc_url($hero_slide_3); ?>')"></div>
    </div>
    <div class="hero-overlay"></div>
    <div class="container hero-content">
        <div class="hero-text">
            <p class="hero-eyebrow reveal"><?php echo esc_html(ecopro_meta('hero_eyebrow', 'Trusted by Fleets Nationwide')); ?></p>
            <h1 class="hero-headline reveal"><?php echo wp_kses_post(nl2br(esc_html(ecopro_meta('hero_headline', 'Cleaner Air.\nLonger Life.')))); ?><br><span class="text-accent"><?php echo esc_html(ecopro_meta('hero_accent', 'Proven Performance.')); ?></span></h1>
            <p class="hero-sub reveal"><?php echo esc_html(ecopro_meta('hero_subtext', 'Industrial-grade filtration, lighting, and protection products that reduce costs, extend equipment life, and keep operators safe — without voiding a single warranty.')); ?></p>
            <div class="hero-ctas reveal">
                <a href="<?php echo esc_url(ecopro_meta('hero_primary_url', '#products')); ?>" class="btn btn-primary btn-lg"><?php echo esc_html(ecopro_meta('hero_primary_text', 'Explore Products')); ?></a>
                <a href="<?php echo esc_url(ecopro_meta('hero_secondary_url', '#contact')); ?>" class="btn btn-outline btn-lg"><?php echo esc_html(ecopro_meta('hero_secondary_text', 'Contact EcoPro')); ?></a>
            </div>
        </div>
        <div class="hero-stats reveal">
            <div class="stat-chip">
                <span class="stat-number" data-target="<?php echo esc_attr(ecopro_meta('stat_1_number', '12000')); ?>" data-prefix="<?php echo esc_attr(ecopro_meta('stat_1_prefix', '$')); ?>" data-suffix="<?php echo esc_attr(ecopro_meta('stat_1_suffix', '')); ?>"><?php echo esc_html(ecopro_meta('stat_1_prefix', '$')); ?>0</span>
                <span class="stat-label"><?php echo esc_html(ecopro_meta('stat_1_label', 'Avg. Annual Savings')); ?></span>
            </div>
            <div class="stat-chip">
                <span class="stat-number" data-target="<?php echo esc_attr(ecopro_meta('stat_2_number', '25000')); ?>" data-prefix="<?php echo esc_attr(ecopro_meta('stat_2_prefix', '')); ?>" data-suffix="<?php echo esc_attr(ecopro_meta('stat_2_suffix', '')); ?>">0</span>
                <span class="stat-label"><?php echo esc_html(ecopro_meta('stat_2_label', 'Hours Proven')); ?></span>
            </div>
            <div class="stat-chip">
                <span class="stat-number" data-target="<?php echo esc_attr(ecopro_meta('stat_3_number', '40')); ?>" data-prefix="<?php echo esc_attr(ecopro_meta('stat_3_prefix', '')); ?>" data-suffix="<?php echo esc_attr(ecopro_meta('stat_3_suffix', '+')); ?>">0</span>
                <span class="stat-label"><?php echo esc_html(ecopro_meta('stat_3_label', 'Years on the Market')); ?></span>
            </div>
        </div>
    </div>
    <div class="hero-scroll-hint" aria-hidden="true"><span></span></div>
</section>

<section class="section what-we-do" id="about">
    <div class="container">
        <div class="section-header reveal">
            <p class="section-eyebrow"><?php echo esc_html(ecopro_meta('about_eyebrow', 'What We Do')); ?></p>
            <h2 class="section-title"><?php echo wp_kses_post(nl2br(esc_html(ecopro_meta('about_title', 'Built for the People\nWho Run the Equipment')))); ?></h2>
            <p class="section-sub"><?php echo esc_html(ecopro_meta('about_subtext', "We're not a manufacturer's rep. We're an independent solutions company that works exclusively for the end user — selecting only the best, safest, and most proven products on the market.")); ?></p>
        </div>
        <div class="pillars-grid">
            <div class="pillar-card reveal"><div class="pillar-icon">✓</div><h3 class="pillar-title">We Work for You — Not the Manufacturer</h3><p class="pillar-text">This is integral to who we are. We promote only the products we believe in — chosen for real-world performance, not brand loyalty. Your uptime and bottom line come first.</p></div>
            <div class="pillar-card reveal"><div class="pillar-icon">★</div><h3 class="pillar-title">Nothing We Sell Will Void Warranties</h3><p class="pillar-text">Every product we carry is designed to integrate safely with your existing equipment. They reduce costs, improve efficiency, extend asset longevity, and support your sustainability initiatives.</p></div>
            <div class="pillar-card reveal"><div class="pillar-icon">◉</div><h3 class="pillar-title">Real Environmental Impact</h3><p class="pillar-text">Beyond cost savings, our products deliver reduced emissions, less waste, and extended asset life. Doing right by the environment and your fleet aren't mutually exclusive.</p></div>
        </div>
    </div>
</section>

<section class="section why-ecopro">
    <div class="why-ecopro-bg" style="background-image:url('<?php echo esc_url($why_background); ?>')"></div>
    <div class="why-ecopro-overlay"></div>
    <div class="container why-ecopro-inner">
        <div class="why-text reveal">
            <p class="section-eyebrow light"><?php echo esc_html(ecopro_meta('why_eyebrow', 'Why EcoPro')); ?></p>
            <h2 class="section-title light"><?php echo wp_kses_post(nl2br(esc_html(ecopro_meta('why_title', '100% Tested.\n100% Validated.\n100% Proven.')))); ?></h2>
            <p class="why-description"><?php echo esc_html(ecopro_meta('why_text', 'Every product in our lineup has been rigorously tested and validated in the harshest real-world conditions. We stand behind what we sell — with start-to-finish support, from selection through installation.')); ?></p>
            <a href="<?php echo esc_url(ecopro_meta('why_button_url', '#products')); ?>" class="btn btn-primary btn-lg"><?php echo esc_html(ecopro_meta('why_button_text', 'See Our Products')); ?></a>
        </div>
        <div class="why-badges reveal">
            <ul class="badge-list">
                <li class="badge-item"><span class="badge-icon">&#10003;</span> Safe &amp; Proven Technology</li>
                <li class="badge-item"><span class="badge-icon">&#10003;</span> Will Not Void Warranty</li>
                <li class="badge-item"><span class="badge-icon">&#10003;</span> Verified Products</li>
                <li class="badge-item"><span class="badge-icon">&#10003;</span> High Return on Investment</li>
                <li class="badge-item"><span class="badge-icon">&#10003;</span> Sizes for All Equipment</li>
                <li class="badge-item"><span class="badge-icon">&#10003;</span> Strong Customer Service</li>
                <li class="badge-item"><span class="badge-icon">&#10003;</span> Installation Available</li>
                <li class="badge-item"><span class="badge-icon">&#10003;</span> Made in the USA</li>
                <li class="badge-item"><span class="badge-icon">&#10003;</span> Independently Owned &amp; Operated</li>
                <li class="badge-item"><span class="badge-icon">&#10003;</span> Not a Manufacturer's Rep</li>
                <li class="badge-item"><span class="badge-icon">&#10003;</span> Positive Environmental Impact</li>
            </ul>
        </div>
    </div>
</section>

<section class="section products" id="products">
    <div class="container">
        <div class="section-header reveal">
            <p class="section-eyebrow"><?php echo esc_html(ecopro_meta('products_eyebrow', 'Featured Products')); ?></p>
            <h2 class="section-title"><?php echo wp_kses_post(nl2br(esc_html(ecopro_meta('products_title', 'Engineered for the\nToughest Environments')))); ?></h2>
            <p class="section-sub"><?php echo esc_html(ecopro_meta('products_subtext', 'From pre-cleaners that extend filter life 3–5x to cabin pressurizers delivering air 200x cleaner than competitors — these are products that earn their keep.')); ?></p>
        </div>
        <div class="products-grid">
            <?php
            $products = array(
                array('name' => 'Turbo II HD PreCleaner', 'img' => 'https://ecoprousa.com/wp-content/uploads/2022/06/product-1.png', 'desc' => 'Centrifugal pre-cleaner with 40+ years of proven performance. Extends engine air filter life 3–5x in the harshest dust environments. One moving part. Lifetime-warranted spinner.', 'highlights' => array('80–90% improved filtration', 'SAE J726 independently tested', 'Fits loaders, graders, haulers & more')),
                array('name' => 'Cabin Air Pressurizer', 'img' => 'https://ecoprousa.com/wp-content/uploads/2022/06/product-2.png', 'desc' => 'Three-stage filtration system that pressurizes equipment cabs to deliver air 200x cleaner than leading competitors at 0.3 microns.', 'highlights' => array('99.998% efficient at 0.3 microns', '2,000-hour filter life', 'Equipment-specific kits available')),
                array('name' => 'LED HD Lights', 'img' => 'https://ecoprousa.com/wp-content/uploads/2025/04/DuraLux-Gen-2_9-LED-Large-300x232.png', 'desc' => 'Mining-grade H30 Series LED work lights built to withstand extreme vibration, washdowns, and harsh operating environments.', 'highlights' => array('Mining-grade durability', 'Extreme vibration rated', 'Plug-and-play installation')),
                array('name' => 'Desiccant Breathers', 'img' => 'https://ecoprousa.com/wp-content/uploads/2022/06/product-4.png', 'desc' => 'Protect diesel and lubricant storage from moisture and airborne contaminants. Color-changing silica indicates replacement timing.', 'highlights' => array('Visual replacement indicator', 'Diesel & lubricant protection', 'Low-profile options available')),
                array('name' => 'Metal Adapters', 'img' => 'https://ecoprousa.com/wp-content/uploads/2023/06/My-project-1-4-2-300x263.jpg', 'desc' => 'In-house manufactured metal stack extensions, expansion adapters, and custom brackets.', 'highlights' => array('Custom in-house manufacturing', 'Stack extensions & expansion adapters', '90-day warranty')),
            );
            foreach ($products as $product) : ?>
                <div class="product-card reveal">
                    <div class="product-img"><img src="<?php echo esc_url($product['img']); ?>" alt="<?php echo esc_attr($product['name']); ?>" loading="lazy"></div>
                    <div class="product-body">
                        <h3 class="product-name"><?php echo esc_html($product['name']); ?></h3>
                        <p class="product-desc"><?php echo esc_html($product['desc']); ?></p>
                        <ul class="product-highlights">
                            <?php foreach ($product['highlights'] as $highlight) : ?>
                                <li><?php echo esc_html($highlight); ?></li>
                            <?php endforeach; ?>
                        </ul>
                        <a href="#contact" class="btn btn-secondary">Learn More</a>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<section class="section results" id="results">
    <div class="container">
        <div class="section-header reveal">
            <p class="section-eyebrow"><?php echo esc_html(ecopro_meta('results_eyebrow', 'Proven Results')); ?></p>
            <h2 class="section-title"><?php echo wp_kses_post(nl2br(esc_html(ecopro_meta('results_title', 'Real Outcomes from\nReal Operations')))); ?></h2>
            <p class="section-sub"><?php echo esc_html(ecopro_meta('results_subtext', "Don't take our word for it. Here's what happens when EcoPro products go to work.")); ?></p>
        </div>
        <div class="results-grid">
            <div class="result-card result-case reveal"><div class="result-tag">Case Study — Turbo II HD</div><h3 class="result-headline">$12,000/Year Saved in Engine Air Filters</h3><p class="result-detail">A recycling facility in Michigan went from 12 engine air filters per month to just 2 — saving $12,000 annually — after installing Turbo II HD PreCleaners.</p><span class="result-source">Recycling Facility, Michigan</span></div>
            <div class="result-card result-case reveal"><div class="result-tag">Case Study — CCAP</div><h3 class="result-headline">25,000 Hours on a D6T Dozer</h3><p class="result-detail">A cabin air pressurizer on a D6T dozer at a Massachusetts municipality landfill reached 25,000 hours of operation.</p><span class="result-source">Massachusetts Municipality Landfill</span></div>
            <div class="result-card result-case reveal"><div class="result-tag">Case Study — CCAP</div><h3 class="result-headline">Clean HVAC After 3 Years</h3><p class="result-detail">After 3 years of continuous use at an Arizona landfill, the HVAC system remained clean.</p><span class="result-source">Arizona Landfill</span></div>
        </div>
        <div class="testimonials-slider reveal" id="testimonials-slider">
            <div class="testimonials-track">
                <div class="testimonial-card"><blockquote class="testimonial-quote">"If you are looking for awesome, knowledgeable people to work with, these are the guys I highly recommend."</blockquote><div class="testimonial-author"><strong>Charlie S., CEO</strong><span>Hunter Contracting</span></div></div>
                <div class="testimonial-card"><blockquote class="testimonial-quote">"Thank you so much for your help and time. You have amazing customer service."</blockquote><div class="testimonial-author"><strong>Fleet Manager</strong><span>Tennessee Waste Industry</span></div></div>
                <div class="testimonial-card"><blockquote class="testimonial-quote">"Man they were bright and very simple. Just plug and go — believe I have another machine that we will be installing these on here soon!"</blockquote><div class="testimonial-author"><strong>Aaron Z.</strong><span>Field Operations</span></div></div>
                <div class="testimonial-card"><blockquote class="testimonial-quote">"Operators clearly notice cleaner cabin air. The difference is unmistakable — especially in dusty landfill conditions."</blockquote><div class="testimonial-author"><strong>Operations Manager</strong><span>Indiana Landfill</span></div></div>
            </div>
            <div class="slider-controls"><button class="slider-btn slider-prev" aria-label="Previous testimonial">&#8592;</button><div class="slider-dots" id="slider-dots"></div><button class="slider-btn slider-next" aria-label="Next testimonial">&#8594;</button></div>
        </div>
    </div>
</section>

<section class="section trusted">
    <div class="container">
        <div class="section-header reveal">
            <p class="section-eyebrow"><?php echo esc_html(ecopro_meta('trusted_eyebrow', 'Trusted By')); ?></p>
            <h2 class="section-title"><?php echo esc_html(ecopro_meta('trusted_title', 'Proven Across Industries')); ?></h2>
        </div>
        <div class="logo-marquee reveal" aria-label="Customer logos">
            <div class="marquee-track">
                <div class="marquee-item">US Air Force</div><div class="marquee-item">Argonaut Gold</div><div class="marquee-item">Salt River Landfill</div><div class="marquee-item">RDO Equipment Co</div><div class="marquee-item">Hunter Contracting</div><div class="marquee-item">Aggregate Industries</div><div class="marquee-item">Arizona Materials</div><div class="marquee-item">Sweeper Sales</div>
                <div class="marquee-item">US Air Force</div><div class="marquee-item">Argonaut Gold</div><div class="marquee-item">Salt River Landfill</div><div class="marquee-item">RDO Equipment Co</div><div class="marquee-item">Hunter Contracting</div><div class="marquee-item">Aggregate Industries</div><div class="marquee-item">Arizona Materials</div><div class="marquee-item">Sweeper Sales</div>
            </div>
        </div>
    </div>
</section>

<section class="section cta-band" id="contact">
    <div class="container cta-inner">
        <div class="cta-text reveal">
            <h2 class="cta-headline"><?php echo esc_html(ecopro_meta('cta_title', 'Ready to Protect Your Fleet?')); ?></h2>
            <p class="cta-sub"><?php echo esc_html(ecopro_meta('cta_text', "Talk to our team about the right products for your equipment. We'll help you select, size, and install — start to finish.")); ?></p>
        </div>
        <div class="cta-actions reveal">
            <a href="<?php echo esc_url(ecopro_meta('cta_primary_url', 'mailto:controller@ecoprousa.com')); ?>" class="btn btn-primary btn-lg"><?php echo esc_html(ecopro_meta('cta_primary_text', 'Get a Quote')); ?></a>
            <a href="<?php echo esc_url(ecopro_meta('cta_secondary_url', 'tel:8553267762')); ?>" class="btn btn-outline-light btn-lg"><?php echo esc_html(ecopro_meta('cta_secondary_text', 'Call 855-ECO-PRO2')); ?></a>
        </div>
    </div>
</section>
<?php get_footer(); ?>

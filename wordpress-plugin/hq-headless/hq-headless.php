<?php
/**
 * Plugin Name:       The Hiddenqueen – Inhalte (Headless)
 * Description:        Lässt Sabrina alle Texte und Bilder der Website thehiddenqueen.de bequem in WordPress pflegen. Beim Speichern wird die Live-Seite automatisch aktualisiert. Das Design der Seite bleibt unverändert.
 * Version:           1.0.0
 * Author:            Brand Queen
 * Requires Plugins:  advanced-custom-fields
 *
 * So funktioniert es (Kurzfassung):
 *  - Das Plugin legt beim Aktivieren die Seiten "Startseite, Über, Galerie, Kontakt, Einstellungen"
 *    im WordPress-Menü an. Dort pflegt Sabrina alle Texte/Bilder (über ACF-Felder).
 *  - Die "Queen's Library"-Artikel sind ganz normale WordPress-Beiträge.
 *  - Der Endpoint  /wp-json/hq/v1/content  liefert alle Inhalte gebündelt als JSON.
 *    Die Build-Pipeline auf Vercel (build.js) liest diesen Endpoint und gießt die Inhalte
 *    in das bestehende Webflow-Design.
 *  - Beim Speichern einer Seite/eines Beitrags wird der Vercel "Deploy Hook" angepingt,
 *    wodurch die Live-Seite neu gebaut und veröffentlicht wird.
 */

if (!defined('ABSPATH')) exit;

class HQ_Headless {

    /** Seiten, die das Plugin verwaltet: slug => [Titel, Felder] */
    public static function groups() {
        $pages = [
            'index' => [
                'slug'  => 'hq-startseite',
                'title' => 'Startseite',
                'page_key' => 'index.html',
                'fields' => [
                    ['name' => 'hero_heading',     'label' => 'Hero-Überschrift (große Schrift oben)', 'type' => 'textarea', 'br' => true],
                    ['name' => 'hero_image',       'label' => 'Hero-Bild (großes Bild oben)',          'type' => 'image'],
                    ['name' => 'section_heading',  'label' => 'Abschnitts-Überschrift',                'type' => 'textarea', 'br' => true],
                    ['name' => 'home_para',        'label' => 'Einleitungstext',                       'type' => 'textarea'],
                    ['name' => 'get_in_touch',     'label' => 'Button-Text',                           'type' => 'text'],
                    ['name' => 'branding_heading', 'label' => 'Überschrift über den 3 Karten',         'type' => 'text'],
                    ['name' => 'branding_sub',     'label' => 'Unterzeile (gold)',                     'type' => 'text'],
                    ['name' => 'img_emotional',    'label' => 'Karte 1 – Bild (führt zur Galerie)',    'type' => 'image'],
                    ['name' => 'img_about',        'label' => 'Karte 2 – Bild (führt zu Über)',        'type' => 'image'],
                    ['name' => 'img_contact',      'label' => 'Karte 3 – Bild (führt zu Kontakt)',     'type' => 'image'],
                ],
            ],
            'about' => [
                'slug'  => 'hq-ueber',
                'title' => 'Über',
                'page_key' => 'about.html',
                'fields' => [
                    ['name' => 'hero_heading',       'label' => 'Hero-Überschrift',     'type' => 'textarea', 'br' => true],
                    ['name' => 'image_one',          'label' => 'Bild 1 (oben)',        'type' => 'image'],
                    ['name' => 'image_two',          'label' => 'Bild 2 (Portrait)',    'type' => 'image'],
                    ['name' => 'modern_heading',     'label' => 'Überschrift 1',        'type' => 'text'],
                    ['name' => 'effect_para_1',      'label' => 'Text 1',               'type' => 'textarea'],
                    ['name' => 'effect_para_2',      'label' => 'Text 2',               'type' => 'textarea'],
                    ['name' => 'colors_heading',     'label' => 'Material-Überschrift', 'type' => 'text'],
                    ['name' => 'color_para',         'label' => 'Material-Text',        'type' => 'textarea'],
                    ['name' => 'begleitung_heading', 'label' => 'Begleitung-Überschrift', 'type' => 'text'],
                    ['name' => 'begleitung_para',    'label' => 'Begleitung-Text',      'type' => 'textarea'],
                    ['name' => 'get_in_touch',       'label' => 'Button-Text',          'type' => 'text'],
                ],
            ],
            'gallery' => [
                'slug'  => 'hq-galerie',
                'title' => 'Galerie',
                'page_key' => 'gallery.html',
                'fields' => [
                    ['name' => 'hero_heading',  'label' => 'Hero-Überschrift',          'type' => 'textarea', 'br' => true],
                    ['name' => 'branding_sub',  'label' => 'Unterzeile',                'type' => 'text'],
                    ['name' => 'gal_portrait',  'label' => 'Galerie – Portrait',        'type' => 'image'],
                    ['name' => 'gal_moodboard', 'label' => 'Galerie – Moodboard',       'type' => 'image'],
                    ['name' => 'gal_three',     'label' => 'Galerie – Detail',          'type' => 'image'],
                    ['name' => 'gal_landscape', 'label' => 'Galerie – Querformat',      'type' => 'image'],
                    ['name' => 'gal_row1',      'label' => 'Galerie – Bild Reihe 1',    'type' => 'image'],
                    ['name' => 'gal_row2',      'label' => 'Galerie – Bild Reihe 2',    'type' => 'image'],
                    ['name' => 'gal_row3',      'label' => 'Galerie – Bild Reihe 3',    'type' => 'image'],
                    ['name' => 'gal_row4',      'label' => 'Galerie – Bild Reihe 4',    'type' => 'image'],
                    ['name' => 'gal_row5',      'label' => 'Galerie – Bild Reihe 5',    'type' => 'image'],
                ],
            ],
            'contact' => [
                'slug'  => 'hq-kontakt',
                'title' => 'Kontakt',
                'page_key' => 'contact.html',
                'fields' => [
                    ['name' => 'hero_heading',       'label' => 'Hero-Überschrift',      'type' => 'textarea', 'br' => true],
                    ['name' => 'intro_heading',      'label' => 'Überschrift',           'type' => 'text'],
                    ['name' => 'direct_label',       'label' => 'Label „Direkt“',        'type' => 'text'],
                    ['name' => 'general_label',      'label' => 'Label „Allgemein“',     'type' => 'text'],
                    ['name' => 'address',            'label' => 'Adresse',               'type' => 'textarea', 'br' => true],
                    ['name' => 'begleitung_heading', 'label' => 'Shop-Hinweis Überschrift', 'type' => 'text'],
                    ['name' => 'begleitung_para',    'label' => 'Shop-Hinweis Text',     'type' => 'textarea'],
                    ['name' => 'get_in_touch',       'label' => 'Button-Text',           'type' => 'text'],
                ],
            ],
            'settings' => [
                'slug'  => 'hq-einstellungen',
                'title' => 'Einstellungen',
                'page_key' => '__settings__',
                'fields' => [
                    ['name' => 'shop_url',        'label' => 'Shop-Adresse (Link für „Shop“)', 'type' => 'text'],
                    ['name' => 'nav_galerie',     'label' => 'Menü-Name: Galerie',  'type' => 'text'],
                    ['name' => 'nav_ueber',       'label' => 'Menü-Name: Über',     'type' => 'text'],
                    ['name' => 'nav_kontakt',     'label' => 'Menü-Name: Kontakt',  'type' => 'text'],
                    ['name' => 'nav_library',     'label' => 'Menü-Name: Library',  'type' => 'text'],
                    ['name' => 'nav_shop',        'label' => 'Menü-Name: Shop',     'type' => 'text'],
                    ['name' => 'impressum_url',   'label' => 'Impressum-Link (Footer)',   'type' => 'text'],
                    ['name' => 'datenschutz_url', 'label' => 'Datenschutz-Link (Footer)', 'type' => 'text'],
                    ['name' => 'agb_url',         'label' => 'AGB-Link (Footer)',         'type' => 'text'],
                    ['name' => 'vercel_deploy_hook', 'label' => 'Vercel Deploy Hook (technisch – wird einmalig eingetragen)', 'type' => 'text'],
                ],
            ],
        ];

        // SEO-Felder (oben) + je Bild ein Alt-Text-Feld (unten) automatisch ergänzen.
        // Leer lassen = aktueller Stand der Website bleibt unverändert.
        foreach ($pages as $k => &$g) {
            if (($g['page_key'] ?? '') === '__settings__') continue;
            $seo = [
                ['name' => 'seo_title',       'label' => 'SEO · Seitentitel (Google & Browser-Tab)', 'type' => 'text'],
                ['name' => 'seo_description', 'label' => 'SEO · Meta-Beschreibung (Google-Vorschau)', 'type' => 'textarea'],
                ['name' => 'seo_keywords',    'label' => 'SEO · Keywords (Komma-getrennt)',           'type' => 'text'],
            ];
            $alts = [];
            foreach ($g['fields'] as $f) {
                if (($f['type'] ?? '') === 'image') {
                    $alts[] = ['name' => $f['name'] . '_alt', 'label' => $f['label'] . ' · Alt-Text', 'type' => 'text'];
                }
            }
            $g['fields'] = array_merge($seo, $g['fields'], $alts);
        }
        unset($g);

        return $pages;
    }

    /* ------------------------------------------------------------------ */
    /* Aktivierung: verwaltete Seiten anlegen                              */
    /* ------------------------------------------------------------------ */
    public static function activate() {
        $ids = get_option('hq_page_ids', []);
        foreach (self::groups() as $g) {
            if (!empty($ids[$g['slug']]) && get_post($ids[$g['slug']])) continue;
            $existing = get_page_by_path($g['slug']);
            if ($existing) {
                $ids[$g['slug']] = $existing->ID;
                continue;
            }
            $pid = wp_insert_post([
                'post_type'   => 'page',
                'post_title'  => 'Website · ' . $g['title'],
                'post_name'   => $g['slug'],
                'post_status' => 'private', // nur im Adminbereich sichtbar, nicht öffentlich
                'post_content'=> '',
            ]);
            if ($pid && !is_wp_error($pid)) $ids[$g['slug']] = $pid;
        }
        update_option('hq_page_ids', $ids);
    }

    /* ------------------------------------------------------------------ */
    /* ACF-Feldgruppen registrieren                                        */
    /* ------------------------------------------------------------------ */
    public static function register_fields() {
        if (!function_exists('acf_add_local_field_group')) return; // ACF nicht aktiv
        $ids = get_option('hq_page_ids', []);
        foreach (self::groups() as $key => $g) {
            $page_id = $ids[$g['slug']] ?? 0;
            if (!$page_id) continue;
            $fields = [];
            foreach ($g['fields'] as $f) {
                $field = [
                    'key'   => 'field_hq_' . $key . '_' . $f['name'],
                    'name'  => $f['name'],
                    'label' => $f['label'],
                    'type'  => $f['type'],
                ];
                if ($f['type'] === 'image') {
                    $field['return_format'] = 'url';   // build.js braucht die Bild-URL
                    $field['preview_size']  = 'medium';
                    $field['library']       = 'all';
                }
                if ($f['type'] === 'textarea') {
                    $field['new_lines'] = '';          // keine automatische Umwandlung – wir machen das im REST
                    $field['rows']      = !empty($f['br']) ? 2 : 4;
                }
                $fields[] = $field;
            }
            acf_add_local_field_group([
                'key'      => 'group_hq_' . $key,
                'title'    => $g['title'],
                'fields'   => $fields,
                'location' => [[['param' => 'page', 'operator' => '==', 'value' => (string) $page_id]]],
                'menu_order' => 0,
                'position'   => 'normal',
                'style'      => 'default',
                'active'     => true,
            ]);
        }
    }

    /* ------------------------------------------------------------------ */
    /* REST-Endpoint  /wp-json/hq/v1/content                               */
    /* ------------------------------------------------------------------ */
    public static function register_rest() {
        register_rest_route('hq/v1', '/content', [
            'methods'  => 'GET',
            'callback' => [__CLASS__, 'rest_content'],
            'permission_callback' => [__CLASS__, 'rest_permission'],
        ]);
    }

    public static function rest_permission($request) {
        $token = trim((string) get_option('hq_api_token', ''));
        if ($token === '') return true; // kein Token gesetzt → öffentlich (Inhalte sind ohnehin öffentlich)
        $sent = $request->get_header('x_hq_token');
        return hash_equals($token, (string) $sent);
    }

    /** Eingegebene Zeilenumbrüche in <br> umwandeln (für Überschriften/Adresse) */
    private static function nl2br_clean($v) {
        $v = str_replace(["\r\n", "\r"], "\n", (string) $v);
        return str_replace("\n", '<br>', trim($v));
    }

    public static function rest_content() {
        $ids = get_option('hq_page_ids', []);
        $out = ['settings' => [], 'pages' => [], 'library' => []];

        foreach (self::groups() as $key => $g) {
            $page_id = $ids[$g['slug']] ?? 0;
            $data = [];
            foreach ($g['fields'] as $f) {
                $val = $page_id ? get_field($f['name'], $page_id) : '';
                if ($f['type'] === 'image' && is_array($val)) $val = $val['url'] ?? '';
                if ($f['type'] === 'textarea' && !empty($f['br'])) $val = self::nl2br_clean($val);
                $data[$f['name']] = $val;
            }
            if ($g['page_key'] === '__settings__') {
                // den technischen Deploy-Hook nicht an die Website weiterreichen
                unset($data['vercel_deploy_hook']);
                $out['settings'] = $data;
            } else {
                $out['pages'][$g['page_key']] = $data;
            }
        }

        // Library = normale WordPress-Beiträge
        $q = new WP_Query([
            'post_type'      => 'post',
            'post_status'    => 'publish',
            'posts_per_page' => -1,
            'orderby'        => 'date',
            'order'          => 'DESC',
        ]);
        foreach ($q->posts as $p) {
            $cover = get_the_post_thumbnail_url($p->ID, 'large');
            $out['library'][] = [
                'slug'     => $p->post_name,
                'title'    => get_the_title($p),
                'date'     => get_the_date('Y-m-d', $p),
                'excerpt'  => has_excerpt($p) ? get_the_excerpt($p) : '',
                'cover'    => $cover ? $cover : '',
                'bodyHtml' => apply_filters('the_content', $p->post_content),
            ];
        }
        wp_reset_postdata();

        return rest_ensure_response($out);
    }

    /* ------------------------------------------------------------------ */
    /* Beim Speichern: Live-Seite neu bauen (Vercel Deploy Hook anpingen)  */
    /* ------------------------------------------------------------------ */
    public static function on_save($post_id, $post = null) {
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
        if (wp_is_post_revision($post_id)) return;
        $post = $post ?: get_post($post_id);
        if (!$post) return;
        // nur unsere Inhaltsseiten und veröffentlichte Beiträge auslösen
        $ids = array_values(get_option('hq_page_ids', []));
        $is_our_page = in_array($post_id, $ids);
        $is_post     = ($post->post_type === 'post' && $post->post_status === 'publish');
        if (!$is_our_page && !$is_post) return;
        self::trigger_deploy();
    }

    public static function trigger_deploy() {
        $hook = trim((string) get_option('hq_deploy_hook', ''));
        if ($hook === '') return false;
        wp_remote_post($hook, ['blocking' => false, 'timeout' => 5]);
        update_option('hq_last_deploy', current_time('mysql'));
        return true;
    }

    /** Deploy-Hook aus dem ACF-Feld in eine schnelle Option spiegeln */
    public static function sync_deploy_hook() {
        $ids = get_option('hq_page_ids', []);
        $settings_id = $ids['hq-einstellungen'] ?? 0;
        if (!$settings_id) return;
        $hook = get_field('vercel_deploy_hook', $settings_id);
        if ($hook !== null) update_option('hq_deploy_hook', trim((string) $hook));
    }

    /* ------------------------------------------------------------------ */
    /* Übersichts-Seite im Adminbereich                                    */
    /* ------------------------------------------------------------------ */
    public static function admin_menu() {
        add_menu_page(
            'Website-Inhalte', 'Website-Inhalte', 'edit_pages',
            'hq-website', [__CLASS__, 'admin_page'], 'dashicons-admin-customizer', 3
        );
    }

    public static function admin_page() {
        $ids = get_option('hq_page_ids', []);
        if (isset($_POST['hq_deploy_now']) && check_admin_referer('hq_deploy_now')) {
            $ok = self::trigger_deploy();
            echo '<div class="notice notice-' . ($ok ? 'success' : 'warning') . '"><p>'
                . ($ok ? 'Live-Seite wird neu veröffentlicht …' : 'Kein Deploy-Hook hinterlegt (siehe Einstellungen).')
                . '</p></div>';
        }
        echo '<div class="wrap"><h1>Website-Inhalte · The Hiddenqueen</h1>';
        echo '<p>Hier pflegst du alle Inhalte der Website <strong>thehiddenqueen.de</strong>. '
           . 'Nach dem Speichern aktualisiert sich die Live-Seite automatisch (in 1–2 Minuten).</p>';
        echo '<h2>Seiten</h2><ul style="font-size:15px;line-height:2;">';
        foreach (self::groups() as $g) {
            $pid = $ids[$g['slug']] ?? 0;
            $url = $pid ? get_edit_post_link($pid) : '';
            echo '<li>📄 ' . ($url ? '<a href="' . esc_url($url) . '">' . esc_html($g['title']) . '</a>' : esc_html($g['title']) . ' (fehlt – Plugin neu aktivieren)') . '</li>';
        }
        echo '<li>📝 <a href="' . esc_url(admin_url('edit.php')) . '">The Queen\'s Library (Beiträge)</a></li>';
        echo '</ul>';
        $last = get_option('hq_last_deploy', '');
        echo '<h2>Jetzt veröffentlichen</h2><p>Normalerweise nicht nötig – passiert beim Speichern automatisch. '
           . 'Falls du eine Aktualisierung manuell anstoßen willst:</p>';
        echo '<form method="post">';
        wp_nonce_field('hq_deploy_now');
        echo '<button class="button button-primary" name="hq_deploy_now" value="1">Live-Seite jetzt aktualisieren</button>';
        if ($last) echo ' <span style="color:#666;">Letzte Auslösung: ' . esc_html($last) . '</span>';
        echo '</form></div>';
    }

    /* ------------------------------------------------------------------ */
    public static function init() {
        add_action('acf/init', [__CLASS__, 'register_fields']);
        add_action('rest_api_init', [__CLASS__, 'register_rest']);
        add_action('save_post', [__CLASS__, 'on_save'], 20, 2);
        add_action('acf/save_post', [__CLASS__, 'sync_deploy_hook'], 20);
        add_action('admin_menu', [__CLASS__, 'admin_menu']);
        // Hinweis, falls ACF fehlt
        add_action('admin_notices', function () {
            if (!function_exists('acf_add_local_field_group')) {
                echo '<div class="notice notice-error"><p><strong>The Hiddenqueen – Inhalte:</strong> '
                   . 'Bitte zuerst das kostenlose Plugin <em>Advanced Custom Fields (ACF)</em> installieren und aktivieren.</p></div>';
            }
        });
    }
}

register_activation_hook(__FILE__, ['HQ_Headless', 'activate']);
HQ_Headless::init();

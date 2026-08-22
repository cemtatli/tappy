export const FEATURE_LABELS = {
  rweb_video_screen_enabled: 'Video ekranı',
  rweb_cashtags_enabled: 'Cashtag’ler ($ semboller)',
  profile_label_improvements_pcf_label_in_post_enabled:
    'Profil etiketleri (gönderide)',
  responsive_web_profile_redirect_enabled: 'Profil yönlendirme',
  rweb_tipjar_consumption_enabled: 'Bahşiş kavanozu',
  verified_phone_label_enabled: 'Doğrulanmış telefon etiketi',
  creator_subscriptions_tweet_preview_api_enabled:
    'Üretici abonelik önizlemesi',
  responsive_web_graphql_timeline_navigation_enabled: 'Zaman tüneli gezinme',
  responsive_web_graphql_skip_user_profile_image_extensions_enabled:
    'Profil resmi uzantılarını atla',
  premium_content_api_read_enabled: 'Premium içerik okuma',
  communities_web_enable_tweet_community_results_fetch:
    'Topluluk tweet sonuçları',
  c9s_tweet_anatomy_moderator_badge_enabled: 'Moderatör rozeti',
  responsive_web_grok_analyze_button_fetch_trends_enabled:
    'Grok: trend analiz butonu',
  responsive_web_grok_analyze_post_followups_enabled:
    'Grok: gönderi takip analizi',
  rweb_cashtags_composer_attachment_enabled: 'Cashtag oluşturucu eki',
  responsive_web_jetfuel_frame: 'Jetfuel çerçevesi',
  responsive_web_grok_share_attachment_enabled: 'Grok: paylaşım eki',
  responsive_web_grok_annotations_enabled: 'Grok: açıklamalar',
  articles_preview_enabled: 'Makale önizleme',
  responsive_web_edit_tweet_api_enabled: 'Tweet düzenleme',
  rweb_conversational_replies_downvote_enabled: 'Yanıt olumsuz oy',
  graphql_is_translatable_rweb_tweet_is_translatable_enabled:
    'Tweet çevrilebilirliği',
  view_counts_everywhere_api_enabled: 'Görüntülenme sayıları',
  longform_notetweets_consumption_enabled: 'Uzun tweet okuma',
  responsive_web_twitter_article_tweet_consumption_enabled:
    'Makale-tweet okuma',
  content_disclosure_indicator_enabled: 'İçerik açıklama göstergesi',
  content_disclosure_ai_generated_indicator_enabled:
    'Yapay zeka içerik göstergesi',
  responsive_web_grok_show_grok_translated_post: 'Grok: çevrilmiş gönderi',
  responsive_web_grok_analysis_button_from_backend: 'Grok: analiz butonu',
  post_ctas_fetch_enabled: 'Gönderi CTA’ları',
  freedom_of_speech_not_reach_fetch_enabled: 'İfade özgürlüğü etiketi',
  standardized_nudges_misinfo: 'Yanlış bilgi uyarıları',
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled:
    'Görünürlük sınırlı işlem politikası',
  longform_notetweets_rich_text_read_enabled: 'Uzun tweet zengin metin',
  longform_notetweets_inline_media_enabled: 'Uzun tweet satır içi medya',
  responsive_web_grok_image_annotation_enabled: 'Grok: görsel açıklaması',
  responsive_web_grok_imagine_annotation_enabled: 'Grok: Imagine açıklaması',
  responsive_web_grok_community_note_auto_translation_is_enabled:
    'Grok: topluluk notu oto-çeviri',
  responsive_web_enhance_cards_enabled: 'Gelişmiş kartlar',
};

export function featureLabel(key) {
  return FEATURE_LABELS[key] ?? key;
}

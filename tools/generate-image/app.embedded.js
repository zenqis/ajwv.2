var STORAGE_KEY = "affiliate-media-studio-settings";
var FOLDER_STORAGE_KEY = "affiliate-media-studio-folders";
var PROMPT_STORAGE_KEY = "affiliate-media-studio-prompts";
var BRAND_INFO_STORAGE_KEY = "affiliate-media-studio-brand-info";
var REQUEST_HISTORY_STORAGE_KEY = "affiliate-media-studio-request-history";
var DEFAULT_OPENAI_IMAGE_MODEL = "gpt-image-2";
var DEFAULT_COMPAT_IMAGE_MODEL = "nano-banana-pro";
var defaultCorePrompt = "";
var defaultBrandInfo = {
  name: "",
  logoDataUrl: "",
  productCategory: "",
  storeReputation: "",
  description: ""
};

var aplusModules = [
  "hero-shot",
  "selling-points",
  "lifestyle-scene",
  "multi-angle-view",
  "atmosphere-scene",
  "product-detail"
];

var listingTemplatePrompts = {
  premium: "Create a premium hero marketplace visual with elevated studio lighting, premium reflections, elegant typography hierarchy, space for headline overlays, and a polished high-conversion composition.",
  marketplace: "Create a clean catalog-style listing image with bright balanced lighting, sharp product clarity, trusted marketplace-safe composition, and concise commercial messaging placement.",
  affiliate: "Create an aggressive promo listing visual with bold campaign energy, discount-driven composition, conversion-focused hierarchy, urgency styling, and eye-catching product emphasis.",
  trust: "Create a bestseller trust-building listing visual with review-driven cues, premium cleanliness, reassuring composition, and subtle authority elements that feel credible and platform compliant.",
  luxury: "Create a luxury editorial fishing gear visual with dramatic mood lighting, rich material detail, refined typography space, premium brand storytelling, and upscale commercial polish.",
  detail: "Create a close-up product detail visual highlighting texture, finishing, materials, craftsmanship, and precision design details with sharp macro emphasis and premium information spacing.",
  comparison: "Create a feature comparison listing layout with clear benefit separation, structured copy hierarchy, icon-friendly negative space, and easy-to-scan product advantage storytelling.",
  lifestyle: "Create a lifestyle-driven listing visual that shows realistic product usage in a believable environment, natural aspirational mood, and product-centered storytelling for stronger buying intent."
};

var multiAngleTemplatePrompts = {
  front: "Front view product image, premium ChatGPT-style polished product photography, clean commercial lighting, refined realistic finish, finished marketplace-ready image.",
  "front-side": "Front side 45 degree product image, premium ChatGPT-style polished product photography, clean commercial lighting, refined realistic finish, finished marketplace-ready image.",
  side: "Side view product image, premium ChatGPT-style polished product photography, clean commercial lighting, refined realistic finish, finished marketplace-ready image.",
  "back-side": "Back side 135 degree product image, premium ChatGPT-style polished product photography, clean commercial lighting, refined realistic finish, finished marketplace-ready image.",
  back: "Back view product image, premium ChatGPT-style polished product photography, clean commercial lighting, refined realistic finish, finished marketplace-ready image.",
  "top-down": "Top down product image, premium ChatGPT-style polished product photography, clean commercial lighting, refined realistic finish, finished marketplace-ready image.",
  "bottom-up": "Bottom up product image, premium ChatGPT-style polished product photography, clean commercial lighting, refined realistic finish, finished marketplace-ready image.",
  "front-elevated": "Front elevated product image, premium ChatGPT-style polished product photography, clean commercial lighting, refined realistic finish, finished marketplace-ready image.",
  "front-closeup": "Front close-up product image, premium ChatGPT-style polished product photography, clean commercial lighting, refined realistic finish, finished marketplace-ready image."
};

var defaultPromptStore = {
  listing: [
    { key: "premium", title: "Premium Hero Marketplace", content: listingTemplatePrompts.premium },
    { key: "marketplace", title: "Clean Catalog Conversion", content: listingTemplatePrompts.marketplace },
    { key: "affiliate", title: "Hard Selling Promo Banner", content: listingTemplatePrompts.affiliate },
    { key: "trust", title: "Best Seller Social Proof", content: listingTemplatePrompts.trust },
    { key: "luxury", title: "Luxury Gear Editorial", content: listingTemplatePrompts.luxury },
    { key: "detail", title: "Close-Up Detail Story", content: listingTemplatePrompts.detail },
    { key: "comparison", title: "Feature Comparison Layout", content: listingTemplatePrompts.comparison },
    { key: "lifestyle", title: "Lifestyle Usage Scene", content: listingTemplatePrompts.lifestyle }
  ],
  multi_angle: [
    { key: "front", title: "Front", content: multiAngleTemplatePrompts.front },
    { key: "front-side", title: "Front Side", content: multiAngleTemplatePrompts["front-side"] },
    { key: "side", title: "Side", content: multiAngleTemplatePrompts.side },
    { key: "back-side", title: "Back Side", content: multiAngleTemplatePrompts["back-side"] },
    { key: "back", title: "Back", content: multiAngleTemplatePrompts.back },
    { key: "top-down", title: "Top Down", content: multiAngleTemplatePrompts["top-down"] },
    { key: "bottom-up", title: "Bottom Up", content: multiAngleTemplatePrompts["bottom-up"] },
    { key: "front-elevated", title: "Front Elevated", content: multiAngleTemplatePrompts["front-elevated"] },
    { key: "front-closeup", title: "Front Close-up", content: multiAngleTemplatePrompts["front-closeup"] }
  ],
  aplus: [
    { key: "premium-story", title: "Premium Brand Story", content: "Create premium A+ content with hero-led composition, strong product storytelling, clean typography hierarchy, and modular supporting sections." },
    { key: "marketplace-trust", title: "Marketplace Trust Builder", content: "Create marketplace-optimized A+ content with trust cues, strong benefit hierarchy, comparison-ready layouts, and conversion-oriented section flow." }
  ],
  bgremove: [
    { key: "clean-cutout", title: "Clean Cutout Standard", content: "Remove the background cleanly, preserve product edges, keep the subject centered, and maintain natural shadows only when useful." },
    { key: "marketplace-main", title: "Marketplace Main Image Cutout", content: "Create a sharp isolated product cutout suitable for marketplace usage, with clean edges, no remaining background clutter, and strong subject fidelity." }
  ],
  video: [
    { key: "video-overlay", title: "Video Prompt + Teks Overlay", content: "Create a realistic product video with clean cinematic motion, polished commercial lighting, subtle depth movement, and safe readable overlay composition." },
    { key: "video-affiliate", title: "Video Prompt Affiliate", content: "Create an affiliate-focused product video with clear product reveal, premium movement, audience-friendly framing, and direct conversion-ready storytelling." },
    { key: "video-pancing", title: "Video Prompt Meja + Produk Pancing", content: "Create a realistic table-shot fishing product video with stable camera motion, product-accurate details, warm premium ambience, and controlled background composition." }
  ],
  corePrompt: defaultCorePrompt
};

function normalizePromptEntry(prompt, fallback, featureHint) {
  var base = fallback || {};
  var feature = prompt?.feature || base.feature || featureHint || "listing";
  var meta = promptFeatureMeta[feature] || promptFeatureMeta.listing;
  return {
    feature,
    key: prompt?.key || base.key || "",
    title: prompt?.title || base.title || "Untitled Prompt",
    content: prompt?.content || base.content || "",
    tag: prompt?.tag || base.tag || "",
    images: Array.isArray(prompt?.images) ? prompt.images.filter(Boolean).slice(0, 8) : (Array.isArray(base.images) ? base.images.slice(0, 8) : []),
    rating: Math.max(1, Math.min(5, Number(prompt?.rating || base.rating || 3))),
    generator: String(prompt?.generator || base.generator || meta.defaultGenerator || "").trim() || meta.defaultGenerator,
    placement: String(prompt?.placement || base.placement || meta.defaultPlacement || "").trim(),
    background: String(prompt?.background || base.background || meta.defaultBackground || "").trim(),
    usePrompt: typeof prompt?.usePrompt === "boolean" ? prompt.usePrompt : (typeof base.usePrompt === "boolean" ? base.usePrompt : true),
    customProperties: (prompt?.customProperties && typeof prompt.customProperties === "object" ? prompt.customProperties : (base.customProperties && typeof base.customProperties === "object" ? base.customProperties : {})) || {},
    usageCount: Math.max(0, Number(prompt?.usageCount || base.usageCount || 0)),
    updatedAt: prompt?.updatedAt || base.updatedAt || new Date().toISOString()
  };
}

function isStorageQuotaError(error) {
  var name = String(error && error.name || "");
  var message = String(error && error.message || "");
  return name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED" || /quota|exceeded/i.test(message);
}

function compactPromptImageForStorage(src, keepSmallImages) {
  if (!src || !keepSmallImages) return "";
  var value = String(src || "");
  return value.length <= 220000 ? value : "";
}

function compactPromptEntryForStorage(prompt, mode) {
  var keepSmallImages = mode === "small-images";
  var compact = normalizePromptEntry(prompt);
  compact.content = String(compact.content || "").slice(0, 12000);
  compact.images = (compact.images || [])
    .slice(0, keepSmallImages ? 2 : 0)
    .map((src) => compactPromptImageForStorage(src, keepSmallImages))
    .filter(Boolean);
  if (compact.customProperties && typeof compact.customProperties === "object") {
    Object.keys(compact.customProperties).forEach((key) => {
      var value = compact.customProperties[key];
      if (Array.isArray(value)) {
        compact.customProperties[key] = value.slice(0, 12).map((item) => {
          if (item && typeof item === "object" && item.src) {
            return {
              name: String(item.name || "file").slice(0, 120),
              src: compactPromptImageForStorage(item.src, keepSmallImages)
            };
          }
          return typeof item === "string" ? item.slice(0, 300) : item;
        }).filter((item) => item && (typeof item !== "object" || item.src));
      } else if (typeof value === "string") {
        compact.customProperties[key] = value.slice(0, 5000);
      }
    });
  }
  return compact;
}

function buildPromptStorePayload(mode) {
  var source = state.promptStore || {};
  var payload = {};
  ["listing", "multi_angle", "aplus", "bgremove", "video"].forEach((feature) => {
    var list = Array.isArray(source[feature]) ? source[feature] : [];
    payload[feature] = mode
      ? list.map((prompt) => compactPromptEntryForStorage(prompt, mode))
      : list.map((prompt) => normalizePromptEntry(prompt));
  });
  payload._schemas = buildPromptPropertySchemaPayload();
  payload._manualImages = (state.promptManualImages || []).map((item) => ({
    id: item.id,
    name: String(item.name || "Gambar").slice(0, 120),
    description: String(item.description || "").slice(0, 500),
    src: compactPromptImageForStorage(item.src, mode === "small-images")
  })).filter((item) => item.src);
  return payload;
}

function buildDefaultPromptState() {
  return {
    listing: defaultPromptStore.listing.map((item) => normalizePromptEntry(item, null, "listing")),
    aplus: defaultPromptStore.aplus.map((item) => normalizePromptEntry(item, null, "aplus")),
    multi_angle: mergeDefaultAnglePrompts(defaultPromptStore.multi_angle.map((item) => normalizePromptEntry(item, null, "multi_angle"))),
    bgremove: defaultPromptStore.bgremove.map((item) => normalizePromptEntry(item, null, "bgremove")),
    video: defaultPromptStore.video.map((item) => normalizePromptEntry(item, null, "video"))
  };
}

function normalizePromptPropertySchemaItem(item, index) {
  var rawType = String(item?.type || "text").trim().toLowerCase();
  var validTypes = new Set(promptPropertyTypeOptions.map((entry) => entry.value));
  var type = validTypes.has(rawType) ? rawType : "text";
  return {
    id: String(item?.id || `prop_${index + 1}`).trim() || `prop_${index + 1}`,
    name: String(item?.name || `Property ${index + 1}`).trim() || `Property ${index + 1}`,
    type,
    options: Array.isArray(item?.options) ? item.options.map((option) => String(option || "").trim()).filter(Boolean).slice(0, 24) : []
  };
}

function buildDefaultPromptPropertySchemas() {
  return {
    listing: [],
    multi_angle: [],
    aplus: [],
    bgremove: [],
    video: []
  };
}

function normalizeLoadedPromptPropertySchemas(parsed) {
  var defaults = buildDefaultPromptPropertySchemas();
  var source = parsed?._schemas && typeof parsed._schemas === "object"
    ? parsed._schemas
    : (parsed?.promptPropertySchemas && typeof parsed.promptPropertySchemas === "object" ? parsed.promptPropertySchemas : {});
  return {
    listing: (Array.isArray(source.listing) ? source.listing : defaults.listing).map(normalizePromptPropertySchemaItem),
    multi_angle: (Array.isArray(source.multi_angle) ? source.multi_angle : defaults.multi_angle).map(normalizePromptPropertySchemaItem),
    aplus: (Array.isArray(source.aplus) ? source.aplus : defaults.aplus).map(normalizePromptPropertySchemaItem),
    bgremove: (Array.isArray(source.bgremove) ? source.bgremove : defaults.bgremove).map(normalizePromptPropertySchemaItem),
    video: (Array.isArray(source.video) ? source.video : defaults.video).map(normalizePromptPropertySchemaItem)
  };
}

function buildPromptPropertySchemaPayload() {
  var source = state.promptPropertySchemas || buildDefaultPromptPropertySchemas();
  return {
    listing: (source.listing || []).map(normalizePromptPropertySchemaItem),
    multi_angle: (source.multi_angle || []).map(normalizePromptPropertySchemaItem),
    aplus: (source.aplus || []).map(normalizePromptPropertySchemaItem),
    bgremove: (source.bgremove || []).map(normalizePromptPropertySchemaItem),
    video: (source.video || []).map(normalizePromptPropertySchemaItem)
  };
}

function normalizeLoadedPromptManualImages(parsed) {
  var source = Array.isArray(parsed?._manualImages)
    ? parsed._manualImages
    : (Array.isArray(parsed?.promptManualImages) ? parsed.promptManualImages : []);
  return source
    .map((item) => ({
      id: String(item?.id || `manual_${Date.now()}`).trim() || `manual_${Date.now()}`,
      name: String(item?.name || "Gambar").trim() || "Gambar",
      description: String(item?.description || "").trim(),
      src: String(item?.src || "").trim()
    }))
    .filter((item) => item.src)
    .slice(0, 48);
}

function hasAnyPromptRows(store) {
  return ["listing", "multi_angle", "aplus", "bgremove", "video"].some((feature) => {
    return Array.isArray(store?.[feature]) && store[feature].length > 0;
  });
}

function hydratePromptFeatureList(parsed, feature, defaults) {
  var rawFeature = parsed?.[feature];
  if (!Array.isArray(rawFeature)) {
    return defaults[feature].map((item) => normalizePromptEntry(item, null, feature));
  }
  return rawFeature.map((item, index) => normalizePromptEntry(item, defaults[feature][index], feature));
}

function normalizeLoadedPromptStore(parsed) {
  var defaults = buildDefaultPromptState();
  var source = parsed?.promptStore && typeof parsed.promptStore === "object" ? parsed.promptStore : parsed;
  var hasExplicitFeatureShape = ["listing", "multi_angle", "aplus", "bgremove", "video"].some((feature) => Array.isArray(source?.[feature]));
  var next = {
    listing: hydratePromptFeatureList(source, "listing", defaults),
    aplus: hydratePromptFeatureList(source, "aplus", defaults),
    multi_angle: hydratePromptFeatureList(source, "multi_angle", defaults),
    bgremove: hydratePromptFeatureList(source, "bgremove", defaults),
    video: hydratePromptFeatureList(source, "video", defaults)
  };
  return hasAnyPromptRows(next) || hasExplicitFeatureShape ? next : defaults;
}

var promptFeatureMeta = {
  listing: { label: "Prompt Image Affiliate", defaultGenerator: "GPT", defaultPlacement: "Affiliate", defaultBackground: "", color: "#F6C56F" },
  multi_angle: { label: "Prompt Image Pancing", defaultGenerator: "GPT", defaultPlacement: "Pancing", defaultBackground: "", color: "#7FD6B0" },
  aplus: { label: "Prompt A+ Content", defaultGenerator: "GPT", defaultPlacement: "Affiliate", defaultBackground: "", color: "#86B7FF" },
  bgremove: { label: "Prompt Background Removal", defaultGenerator: "GPT", defaultPlacement: "Utility", defaultBackground: "Transparent", color: "#C8A2FF" },
  video: { label: "Prompt Video", defaultGenerator: "Grok", defaultPlacement: "Affiliate", defaultBackground: "Orang", color: "#FFA97A" }
};

var promptPropertyTypeOptions = [
  { value: "text", label: "Teks" },
  { value: "number", label: "Angka" },
  { value: "select", label: "Pilih" },
  { value: "multi_select", label: "Multipilih" },
  { value: "checkbox", label: "Kotak centang" },
  { value: "url", label: "URL" },
  { value: "file_media", label: "File & media" },
  { value: "date", label: "Tanggal" }
];

function buildPromptHubMarkup() {
  return `
    <div style="display:grid;gap:18px">
      <div class="gi-panel" style="padding:18px;background:#ffffff;border:1px solid #e5e5e5">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
          <div>
            <div style="font-size:28px;font-weight:800;color:#1f1f1f">AI Prompt</div>
            <div class="gi-muted" style="max-width:900px;margin-top:6px;line-height:1.7;color:#5f5f5f">Database prompt bergaya Notion untuk semua kebutuhan Generate Image. Setiap prompt punya properti pendukung, file & media, serta editor yang dibuka lewat tombol. Buat prompt baru atau pilih prompt yang sudah ada.</div>
          </div>
          <div class="gi-tools">
            <span id="promptCount" class="listing-output-chip">0 prompt</span>
            <button id="promptNewBtn" class="gi-mini-btn" type="button" style="padding:10px 14px;border-color:#d9d9d9;background:#ffffff;color:#1f1f1f">+ Prompt</button>
          </div>
        </div>
        <div id="promptStatus" class="gi-muted" style="margin-top:10px;color:#5f5f5f">Database prompt bergaya Notion untuk semua kebutuhan Generate Image. Setiap prompt punya properti pendukung, file & media, serta editor yang dibuka lewat tombol. Buat prompt baru atau pilih prompt yang sudah ada.</div>
      </div>
      <div id="promptList" style="display:grid;gap:18px"></div>
      <div class="gi-panel" style="padding:18px">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:12px;flex-wrap:wrap">
          <div style="font-size:15px;font-weight:800;color:#1f1f1f">Gambar</div>
          <button id="promptManualImageBtn" class="gi-mini-btn" type="button">+ Gambar</button>
        </div>
        <div id="promptMemoryList" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px"></div>
      </div>
    </div>
    <div id="promptEditorDialog" class="hidden" style="position:fixed;inset:0;z-index:80;background:rgba(0,0,0,.72);padding:24px;overflow:auto">
      <div style="max-width:1180px;margin:0 auto;background:#ffffff;border:1px solid #e5e5e5;border-radius:18px;padding:18px;box-shadow:0 20px 48px rgba(17,17,17,.08)">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:16px">
          <div>
            <div id="promptEditorTitleBar" style="font-size:22px;font-weight:800;color:#1f1f1f">Prompt Editor</div>
            <div class="gi-muted">Edit prompt seperti halaman detail database, lalu simpan untuk dipakai di fitur terkait.</div>
          </div>
          <button id="promptEditorCloseBtn" class="gi-mini-btn" type="button">Tutup</button>
        </div>
        <div style="display:grid;grid-template-columns:minmax(0,1.15fr) minmax(320px,.85fr);gap:16px;align-items:start">
          <div class="gi-panel" style="padding:16px">
            <div class="gi-grid3">
              <div class="gi-field"><label>Feature</label><select id="promptFeature"><option value="listing">Prompt Image Affiliate</option><option value="multi_angle">Prompt Image Pancing</option><option value="aplus">Prompt A+ Content</option><option value="bgremove">Prompt Background Removal</option><option value="video">Prompt Video</option></select></div>
              <div class="gi-field"><label>Prompt Key</label><input id="promptKey" placeholder="thumbnail-hero"></div>
              <div class="gi-field"><label>Rating</label><input id="promptRating" type="number" min="1" max="5" step="1" placeholder="1-5"></div>
            </div>
            <div class="gi-grid2">
              <div class="gi-field"><label>Nama Prompt</label><input id="promptTitle" placeholder="BG WANITA + Produk GPT"></div>
              <div class="gi-field"><label>Tag</label><input id="promptTag" placeholder="thumbnail, affiliate, studio"></div>
            </div>
            <div class="gi-grid3">
              <div class="gi-field"><label>Image / Video Generator</label><select id="promptGenerator"><option value="GPT">GPT</option><option value="Grok">Grok</option><option value="Gemini">Gemini</option><option value="Custom">Custom</option></select></div>
              <div class="gi-field"><label>Penempatan</label><input id="promptPlacement" placeholder="Affiliate / Pancing / Meja"></div>
              <div class="gi-field"><label>Background</label><input id="promptBackground" placeholder="Orang / Meja / Polos"></div>
            </div>
            <div class="gi-field"><label>Teks Prompt</label><textarea id="promptContent" placeholder="Tulis prompt utama yang akan dipakai generate..." style="min-height:260px"></textarea></div>
            <div class="gi-field">
              <div class="gi-row"><label>File & media</label><span id="promptImageCount" class="gi-muted">0/8</span></div>
              <input id="promptImageUpload" class="hidden" accept="image/*" multiple type="file">
              <button id="promptImageBtn" class="gi-drop" type="button"><strong>Tambah Gambar</strong><span>Upload gambar referensi, background, atau thumbnail prompt</span></button>
              <div id="promptImageList" class="gi-upload-list"></div>
            </div>
            <div class="gi-tools" style="margin-top:10px">
              <label class="gi-mini-btn" style="display:inline-flex;align-items:center;gap:8px;cursor:pointer"><input id="promptUse" type="checkbox" checked style="accent-color:#FFA500"> USE?</label>
              <button id="promptPreviewBtn" class="gi-mini-btn" type="button">Preview</button>
              <button id="promptDeleteBtn" class="gi-mini-btn" type="button">Hapus</button>
              <button id="promptSaveBtn" class="gi-action" type="button" style="width:auto">Simpan Prompt</button>
            </div>
          </div>
          <div style="display:grid;gap:16px">
            <div class="gi-panel" style="padding:16px">
              <div style="font-size:13px;font-weight:800;color:#1f1f1f;margin-bottom:8px">Preview Prompt</div>
              <pre id="promptPreviewOutput" class="request-code" style="min-height:240px;max-height:520px"></pre>
            </div>
            <div class="gi-panel" style="padding:16px">
              <div style="font-size:13px;font-weight:800;color:#1f1f1f;margin-bottom:8px">Database Notes</div>
              <div class="gi-muted">Kolom property akan tampil sebagai tabel di halaman utama Prompt. Tombol Edit membuka detail ini seperti page detail di Notion.</div>
              <div class="gi-muted" style="margin-top:10px">Gambar yang Anda upload di sini akan tersimpan sebagai file & media prompt, lalu muncul di gallery bawah.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div id="promptPreviewDialog" class="hidden" style="position:fixed;inset:0;z-index:81;background:rgba(0,0,0,.78);padding:24px;overflow:auto">
      <div style="max-width:980px;margin:0 auto;background:#ffffff;border:1px solid #e5e5e5;border-radius:18px;padding:18px;box-shadow:0 20px 48px rgba(17,17,17,.08)">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:16px;flex-wrap:wrap">
          <div>
            <div id="promptPreviewTitle" style="font-size:22px;font-weight:800;color:#1f1f1f">Prompt Preview</div>
            <div class="gi-muted">Ringkasan prompt, properti, dan media. Mode ini hanya baca dan siap disalin.</div>
          </div>
          <div class="gi-tools">
            <button id="promptPreviewCopyAllBtn" class="gi-mini-btn" type="button">Salin Semua</button>
            <button id="promptPreviewCloseBtn" class="gi-mini-btn" type="button">Tutup</button>
          </div>
        </div>
        <div id="promptPreviewBody" style="display:grid;gap:16px"></div>
      </div>
    </div>
    <div id="promptPropertyDialog" class="hidden" style="position:fixed;inset:0;z-index:82;background:rgba(0,0,0,.78);padding:24px;overflow:auto">
      <div style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #e5e5e5;border-radius:18px;padding:18px;box-shadow:0 20px 48px rgba(17,17,17,.08)">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:16px;flex-wrap:wrap">
          <div>
            <div style="font-size:22px;font-weight:800;color:#1f1f1f">Tambah Property</div>
            <div class="gi-muted">Tambahkan kolom baru seperti database Notion, lalu isi langsung di tabel.</div>
          </div>
          <button id="promptPropertyCloseBtn" class="gi-mini-btn" type="button">Tutup</button>
        </div>
        <div class="gi-panel" style="padding:16px">
          <div class="gi-grid3">
            <div class="gi-field"><label>Feature</label><select id="promptPropertyFeature"><option value="listing">Prompt Image Affiliate</option><option value="multi_angle">Prompt Image Pancing</option><option value="aplus">Prompt A+ Content</option><option value="bgremove">Prompt Background Removal</option><option value="video">Prompt Video</option></select></div>
            <div class="gi-field" style="grid-column:span 2"><label>Nama Property</label><input id="promptPropertyName" placeholder="Misal: Bahasa, CTA, Hook Angle"></div>
          </div>
          <div class="gi-grid2">
            <div class="gi-field"><label>Jenis</label><select id="promptPropertyType">${promptPropertyTypeOptions.map((item) => `<option value="${item.value}">${item.label}</option>`).join("")}</select></div>
            <div class="gi-field"><label>Opsi</label><input id="promptPropertyOptions" placeholder="Pisahkan dengan koma untuk Pilih / Multipilih"></div>
          </div>
          <div class="gi-tools" style="margin-top:10px">
            <button id="promptPropertySaveBtn" class="gi-action" type="button" style="width:auto">Tambah Property</button>
          </div>
        </div>
      </div>
    </div>
    <div id="promptManualImageDialog" class="hidden" style="position:fixed;inset:0;z-index:83;background:rgba(0,0,0,.78);padding:24px;overflow:auto">
      <div style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #e5e5e5;border-radius:18px;padding:18px;box-shadow:0 20px 48px rgba(17,17,17,.08)">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:16px;flex-wrap:wrap">
          <div>
            <div style="font-size:22px;font-weight:800;color:#1f1f1f">Tambah Gambar</div>
            <div class="gi-muted">Isi judul, upload gambar, dan deskripsi. Grid hanya menampilkan gambar dan judul.</div>
          </div>
          <button id="promptManualImageCloseBtn" class="gi-mini-btn" type="button">Tutup</button>
        </div>
        <div class="gi-panel" style="padding:16px">
          <div class="gi-grid2">
            <div class="gi-field"><label>Judul</label><input id="promptManualImageTitle" placeholder="Misal: BG Wanita 1"></div>
            <div class="gi-field"><label>Upload Gambar</label><input id="promptManualImageUpload" type="file" accept="image/*"></div>
          </div>
          <div class="gi-field"><label>Deskripsi</label><textarea id="promptManualImageDescription" placeholder="Catatan singkat gambar..." style="min-height:120px"></textarea></div>
          <div class="gi-tools" style="margin-top:10px">
            <button id="promptManualImageSaveBtn" class="gi-action" type="button" style="width:auto">Simpan Gambar</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function mountPromptHub() {
  var host = document.getElementById("prompt-hub");
  if (!host) return;
  host.innerHTML = buildPromptHubMarkup();
}

mountPromptHub();

var els = {
  workspaceTabs: document.querySelectorAll(".workspace-tab"),
  workspacePanels: document.querySelectorAll(".workspace-panel"),
  apiStatus: document.getElementById("apiStatus"),
  gptApiKey: document.getElementById("gptApiKey"),
  gptApiBaseUrl: document.getElementById("gptApiBaseUrl"),
  testGptConnectionBtn: document.getElementById("testGptConnectionBtn"),
  gptConnectionStatus: document.getElementById("gptConnectionStatus"),
  geminiApiKey: document.getElementById("geminiApiKey"),
  geminiApiBaseUrl: document.getElementById("geminiApiBaseUrl"),
  geminiImageModel: document.getElementById("geminiImageModel"),
  testGeminiConnectionBtn: document.getElementById("testGeminiConnectionBtn"),
  geminiConnectionStatus: document.getElementById("geminiConnectionStatus"),
  falApiKey: document.getElementById("falApiKey"),
  falApiBaseUrl: document.getElementById("falApiBaseUrl"),
  falImageModel: document.getElementById("falImageModel"),
  falImageSize: document.getElementById("falImageSize"),
  falQuality: document.getElementById("falQuality"),
  testFalConnectionBtn: document.getElementById("testFalConnectionBtn"),
  falConnectionStatus: document.getElementById("falConnectionStatus"),
  backendApiBaseUrl: document.getElementById("backendApiBaseUrl"),
  customProviderName: document.getElementById("customProviderName"),
  customApiBaseUrl: document.getElementById("customApiBaseUrl"),
  customApiKey: document.getElementById("customApiKey"),
  customImageModel: document.getElementById("customImageModel"),
  xaiApiKey: document.getElementById("xaiApiKey"),
  testCustomConnectionBtn: document.getElementById("testCustomConnectionBtn"),
  customConnectionStatus: document.getElementById("customConnectionStatus"),
  videoModel: document.getElementById("videoModel"),
  supabaseUrl: document.getElementById("supabaseUrl"),
  supabaseAnonKey: document.getElementById("supabaseAnonKey"),
  pollInterval: document.getElementById("pollInterval"),
  saveSettingsBtn: document.getElementById("saveSettingsBtn"),
  clearSettingsBtn: document.getElementById("clearSettingsBtn"),
  brandLogo: document.getElementById("brandLogo"),
  brandLogoPreview: document.getElementById("brandLogoPreview"),
  brandName: document.getElementById("brandName"),
  brandProductCategory: document.getElementById("brandProductCategory"),
  brandStoreReputation: document.getElementById("brandStoreReputation"),
  brandDescription: document.getElementById("brandDescription"),
  brandSaveBtn: document.getElementById("brandSaveBtn"),
  brandClearBtn: document.getElementById("brandClearBtn"),
  brandStatus: document.getElementById("brandStatus"),
  brandReferenceLogo: document.getElementById("brandReferenceLogo"),
  brandReferenceLogoPlaceholder: document.getElementById("brandReferenceLogoPlaceholder"),
  brandReferenceName: document.getElementById("brandReferenceName"),
  brandReferenceMeta: document.getElementById("brandReferenceMeta"),
  brandReferencePrompt: document.getElementById("brandReferencePrompt"),
  listingProductUpload: document.getElementById("listingProductUpload"),
  listingUploadBtn: document.getElementById("listingUploadBtn"),
  listingProductCount: document.getElementById("listingProductCount"),
  listingUploadList: document.getElementById("listingUploadList"),
  listingQuantity: document.getElementById("listingQuantity"),
  listingSize: document.getElementById("listingSize"),
  listingProvider: document.getElementById("listingProvider"),
  listingImageModel: document.getElementById("listingImageModel"),
  listingLanguage: document.getElementById("listingLanguage"),
  listingSellingPoints: document.getElementById("listingSellingPoints"),
  listingTemplate: document.getElementById("listingTemplate"),
  listingPrompt: document.getElementById("listingPrompt"),
  listingWebLikeMode: document.getElementById("listingWebLikeMode"),
  listingEnhancePromptBtn: document.getElementById("listingEnhancePromptBtn"),
  listingEnhancedPrompt: document.getElementById("listingEnhancedPrompt"),
  listingEstimateBox: document.getElementById("listingEstimateBox"),
  generateListingBtn: document.getElementById("generateListingBtn"),
  listingStatus: document.getElementById("listingStatus"),
  listingProgressBox: document.getElementById("listingProgressBox"),
  listingProgressTitle: document.getElementById("listingProgressTitle"),
  listingProgressPercent: document.getElementById("listingProgressPercent"),
  listingProgressBar: document.getElementById("listingProgressBar"),
  listingProgressDetail: document.getElementById("listingProgressDetail"),
  listingPreviewGrid: document.getElementById("listingPreviewGrid"),
  listingPreviewModeBtn: document.getElementById("listingPreviewModeBtn"),
  listingAutoLayoutBtn: document.getElementById("listingAutoLayoutBtn"),
  listingDownloadBtn: document.getElementById("listingDownloadBtn"),
  folderToggleBtn: document.getElementById("folderToggleBtn"),
  folderDropdown: document.getElementById("folderDropdown"),
  folderToggleIcon: document.getElementById("folderToggleIcon"),
  folderListingCount: document.getElementById("folderListingCount"),
  folderMultiCount: document.getElementById("folderMultiCount"),
  folderAplusCount: document.getElementById("folderAplusCount"),
  multiProductUpload: document.getElementById("multiProductUpload"),
  multiUploadBtn: document.getElementById("multiUploadBtn"),
  multiProductCount: document.getElementById("multiProductCount"),
  multiUploadList: document.getElementById("multiUploadList"),
  multiProvider: document.getElementById("multiProvider"),
  multiImageModel: document.getElementById("multiImageModel"),
  multiAspectRatio: document.getElementById("multiAspectRatio"),
  multiLanguage: document.getElementById("multiLanguage"),
  multiSellingPoints: document.getElementById("multiSellingPoints"),
  multiTemplate: document.getElementById("multiTemplate"),
  multiPromptList: document.getElementById("multiPromptList"),
  multiPrompt: document.getElementById("multiPrompt"),
  multiWebLikeMode: document.getElementById("multiWebLikeMode"),
  multiEnhancePromptBtn: document.getElementById("multiEnhancePromptBtn"),
  multiClearEnhancedBtn: document.getElementById("multiClearEnhancedBtn"),
  multiEnhancedPromptOutput: document.getElementById("multiEnhancedPromptOutput"),
  multiEstimateBox: document.getElementById("multiEstimateBox"),
  multiAngleTiles: document.querySelectorAll(".multi-angle-tile"),
  multiAngleCountLabel: document.getElementById("multiAngleCountLabel"),
  multiHeroSubtitle: document.getElementById("multiHeroSubtitle"),
  multiSelectAllBtn: document.getElementById("multiSelectAllBtn"),
  multiClearBtn: document.getElementById("multiClearBtn"),
  generateMultiBtn: document.getElementById("generateMultiBtn"),
  multiStatus: document.getElementById("multiStatus"),
  multiProgressBox: document.getElementById("multiProgressBox"),
  multiProgressTitle: document.getElementById("multiProgressTitle"),
  multiProgressPercent: document.getElementById("multiProgressPercent"),
  multiProgressBar: document.getElementById("multiProgressBar"),
  multiProgressDetail: document.getElementById("multiProgressDetail"),
  multiPreviewGrid: document.getElementById("multiPreviewGrid"),
  multiDownloadBtn: document.getElementById("multiDownloadBtn"),
  bgremoveUpload: document.getElementById("bgremoveUpload"),
  bgremoveUploadBtn: document.getElementById("bgremoveUploadBtn"),
  bgremoveCount: document.getElementById("bgremoveCount"),
  bgremoveUploadList: document.getElementById("bgremoveUploadList"),
  bgremoveProvider: document.getElementById("bgremoveProvider"),
  bgremoveImageModel: document.getElementById("bgremoveImageModel"),
  bgremoveModel: document.getElementById("bgremoveModel"),
  bgremovePromptPreset: document.getElementById("bgremovePromptPreset"),
  bgremoveLanguage: document.getElementById("bgremoveLanguage"),
  bgremoveResolution: document.getElementById("bgremoveResolution"),
  bgremoveFormat: document.getElementById("bgremoveFormat"),
  bgremoveRefine: document.getElementById("bgremoveRefine"),
  bgremoveEstimateBox: document.getElementById("bgremoveEstimateBox"),
  generateBgremoveBtn: document.getElementById("generateBgremoveBtn"),
  bgremoveStatus: document.getElementById("bgremoveStatus"),
  bgremoveProgressBox: document.getElementById("bgremoveProgressBox"),
  bgremoveProgressTitle: document.getElementById("bgremoveProgressTitle"),
  bgremoveProgressPercent: document.getElementById("bgremoveProgressPercent"),
  bgremoveProgressBar: document.getElementById("bgremoveProgressBar"),
  bgremoveProgressDetail: document.getElementById("bgremoveProgressDetail"),
  bgremovePreviewGrid: document.getElementById("bgremovePreviewGrid"),
  bgremoveDownloadBtn: document.getElementById("bgremoveDownloadBtn"),
  aplusProductUpload: document.getElementById("aplusProductUpload"),
  aplusUploadBtn: document.getElementById("aplusUploadBtn"),
  aplusProductCount: document.getElementById("aplusProductCount"),
  aplusUploadList: document.getElementById("aplusUploadList"),
  aplusReferenceUpload: document.getElementById("aplusReferenceUpload"),
  aplusReferenceBtn: document.getElementById("aplusReferenceBtn"),
  aplusReferenceCount: document.getElementById("aplusReferenceCount"),
  aplusReferenceList: document.getElementById("aplusReferenceList"),
  aplusPlatform: document.getElementById("aplusPlatform"),
  aplusProvider: document.getElementById("aplusProvider"),
  aplusImageModel: document.getElementById("aplusImageModel"),
  aplusLanguage: document.getElementById("aplusLanguage"),
  aplusAspectRatio: document.getElementById("aplusAspectRatio"),
  aplusPromptPreset: document.getElementById("aplusPromptPreset"),
  aplusSellingPoints: document.getElementById("aplusSellingPoints"),
  aplusDesignRequirements: document.getElementById("aplusDesignRequirements"),
  styleModeTrending: document.getElementById("styleModeTrending"),
  styleModeReference: document.getElementById("styleModeReference"),
  trendingStylePanel: document.getElementById("trendingStylePanel"),
  referenceStylePanel: document.getElementById("referenceStylePanel"),
  oneClickAnalysisBtn: document.getElementById("oneClickAnalysisBtn"),
  generateSellingPointsBtn: document.getElementById("generateSellingPointsBtn"),
  trendingStyleAnalysisBtn: document.getElementById("trendingStyleAnalysisBtn"),
  moduleCards: document.querySelectorAll(".module-card"),
  aplusModuleCount: document.getElementById("aplusModuleCount"),
  generateAplusBtn: document.getElementById("generateAplusBtn"),
  aplusGenerateHint: document.getElementById("aplusGenerateHint"),
  aplusEstimateBox: document.getElementById("aplusEstimateBox"),
  aplusProgressBox: document.getElementById("aplusProgressBox"),
  aplusProgressTitle: document.getElementById("aplusProgressTitle"),
  aplusProgressPercent: document.getElementById("aplusProgressPercent"),
  aplusProgressBar: document.getElementById("aplusProgressBar"),
  aplusProgressDetail: document.getElementById("aplusProgressDetail"),
  aplusHeroImage: document.getElementById("aplusHeroImage"),
  aplusCard2Image: document.getElementById("aplusCard2Image"),
  aplusCard3Image: document.getElementById("aplusCard3Image"),
  aplusPreviewGrid: document.getElementById("aplusPreviewGrid"),
  promptFeature: document.getElementById("promptFeature"),
  promptCore: document.getElementById("promptCore"),
  promptTitle: document.getElementById("promptTitle"),
  promptTag: document.getElementById("promptTag"),
  promptKey: document.getElementById("promptKey"),
  promptRating: document.getElementById("promptRating"),
  promptGenerator: document.getElementById("promptGenerator"),
  promptPlacement: document.getElementById("promptPlacement"),
  promptBackground: document.getElementById("promptBackground"),
  promptUse: document.getElementById("promptUse"),
  promptContent: document.getElementById("promptContent"),
  promptNewBtn: document.getElementById("promptNewBtn"),
  promptSaveBtn: document.getElementById("promptSaveBtn"),
  promptDeleteBtn: document.getElementById("promptDeleteBtn"),
  promptImageUpload: document.getElementById("promptImageUpload"),
  promptImageBtn: document.getElementById("promptImageBtn"),
  promptImageCount: document.getElementById("promptImageCount"),
  promptImageList: document.getElementById("promptImageList"),
  promptPreviewBtn: document.getElementById("promptPreviewBtn"),
  promptPreviewOutput: document.getElementById("promptPreviewOutput"),
  promptStatus: document.getElementById("promptStatus"),
  promptCount: document.getElementById("promptCount"),
  promptList: document.getElementById("promptList"),
  promptMemoryList: document.getElementById("promptMemoryList"),
  promptManualImageBtn: document.getElementById("promptManualImageBtn"),
  promptManualImageDialog: document.getElementById("promptManualImageDialog"),
  promptManualImageCloseBtn: document.getElementById("promptManualImageCloseBtn"),
  promptManualImageTitle: document.getElementById("promptManualImageTitle"),
  promptManualImageUpload: document.getElementById("promptManualImageUpload"),
  promptManualImageDescription: document.getElementById("promptManualImageDescription"),
  promptManualImageSaveBtn: document.getElementById("promptManualImageSaveBtn"),
  promptEditorDialog: document.getElementById("promptEditorDialog"),
  promptEditorTitleBar: document.getElementById("promptEditorTitleBar"),
  promptEditorCloseBtn: document.getElementById("promptEditorCloseBtn"),
  promptPreviewDialog: document.getElementById("promptPreviewDialog"),
  promptPreviewTitle: document.getElementById("promptPreviewTitle"),
  promptPreviewBody: document.getElementById("promptPreviewBody"),
  promptPreviewCloseBtn: document.getElementById("promptPreviewCloseBtn"),
  promptPreviewCopyAllBtn: document.getElementById("promptPreviewCopyAllBtn"),
  promptPropertyDialog: document.getElementById("promptPropertyDialog"),
  promptPropertyFeature: document.getElementById("promptPropertyFeature"),
  promptPropertyName: document.getElementById("promptPropertyName"),
  promptPropertyType: document.getElementById("promptPropertyType"),
  promptPropertyOptions: document.getElementById("promptPropertyOptions"),
  promptPropertySaveBtn: document.getElementById("promptPropertySaveBtn"),
  promptPropertyCloseBtn: document.getElementById("promptPropertyCloseBtn"),
  requestSearch: document.getElementById("requestSearch"),
  requestStatusFilter: document.getElementById("requestStatusFilter"),
  requestShowPreview: document.getElementById("requestShowPreview"),
  requestClearHistoryBtn: document.getElementById("requestClearHistoryBtn"),
  requestHistoryList: document.getElementById("requestHistoryList"),
  requestDetailTitle: document.getElementById("requestDetailTitle"),
  requestDetailSubtitle: document.getElementById("requestDetailSubtitle"),
  requestDetailImage: document.getElementById("requestDetailImage"),
  requestShareBtn: document.getElementById("requestShareBtn"),
  requestDownloadBtn: document.getElementById("requestDownloadBtn"),
  requestCopyPromptBtn: document.getElementById("requestCopyPromptBtn"),
  requestDetailMeta: document.getElementById("requestDetailMeta"),
  requestInputBlock: document.getElementById("requestInputBlock"),
  requestOutputBlock: document.getElementById("requestOutputBlock"),
  requestCodeBlock: document.getElementById("requestCodeBlock")
};

var state = {
  listingProductFiles: [],
  listingResults: [],
  listingPreviewMode: "fill",
  listingAutoLayout: false,
  multiProductFiles: [],
  multiResults: [],
  selectedMultiPromptKeys: new Set(),
  selectedMultiPromptTouched: false,
  multiEnhancedPrompts: {},
  bgremoveFiles: [],
  bgremoveResults: [],
  promptStore: JSON.parse(JSON.stringify(defaultPromptStore)),
  promptPropertySchemas: buildDefaultPromptPropertySchemas(),
  promptManualImages: [],
  promptPreviewFiles: [],
  promptExistingImages: [],
  promptExpandedFeatures: {},
  promptHighlightedPair: "",
  promptBulkDeleteMode: {},
  promptSelectedRows: {},
  corePrompt: defaultCorePrompt,
  brandInfo: { ...defaultBrandInfo },
  activePromptFeature: "listing",
  activePromptKey: "",
  folders: {
    listing: [],
    multi: [],
    aplus: []
  },
  selectedAngles: new Set([
    "front",
    "front-side",
    "side",
    "back-side",
    "back",
    "top-down",
    "bottom-up",
    "front-elevated",
    "front-closeup"
  ]),
  aplusProductFiles: [],
  aplusReferenceFiles: [],
  selectedModules: new Set(aplusModules),
  activeWorkspace: "aplus-content",
  activeStyleMode: "trending",
  requestHistory: [],
  activeRequestId: "",
  generationProgress: {
    listing: { active: false, percent: 0, title: "Menunggu generate", detail: "Progress output listing akan muncul di sini." },
    aplus: { active: false, percent: 0, title: "Menunggu generate", detail: "Progress output A+ akan muncul di sini." },
    multi: { active: false, percent: 0, title: "Menunggu generate", detail: "Progress output multi-angle akan muncul di sini." },
    bgremove: { active: false, percent: 0, title: "Menunggu proses", detail: "Progress background removal akan muncul di sini." }
  }
};

function getSettings() {
  var raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return normalizeSettings({
      gptApiKey: "",
      gptApiBaseUrl: "https://api.openai.com/v1",
      imageModel: DEFAULT_OPENAI_IMAGE_MODEL,
      geminiApiKey: "",
      geminiApiBaseUrl: "https://generativelanguage.googleapis.com/v1beta",
      geminiImageModel: "gemini-2.0-flash-preview-image-generation",
      falApiKey: "",
      falApiBaseUrl: "https://fal.run",
      falImageModel: "openai/gpt-image-2/edit",
      falImageSize: "auto",
      falQuality: "high",
      backendApiBaseUrl: "http://localhost:3010",
      customProviderName: "",
      customApiBaseUrl: "",
      customApiKey: "",
      customImageModel: "",
      xaiApiKey: "",
      videoModel: "sora-2",
      supabaseUrl: "",
      supabaseAnonKey: "",
      pollInterval: 10000
    });
  }

  try {
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return normalizeSettings({
      gptApiKey: "",
      gptApiBaseUrl: "https://api.openai.com/v1",
      imageModel: DEFAULT_OPENAI_IMAGE_MODEL,
      geminiApiKey: "",
      geminiApiBaseUrl: "https://generativelanguage.googleapis.com/v1beta",
      geminiImageModel: "gemini-2.0-flash-preview-image-generation",
      falApiKey: "",
      falApiBaseUrl: "https://fal.run",
      falImageModel: "openai/gpt-image-2/edit",
      falImageSize: "auto",
      falQuality: "high",
      backendApiBaseUrl: "http://localhost:3010",
      customProviderName: "",
      customApiBaseUrl: "",
      customApiKey: "",
      customImageModel: "",
      xaiApiKey: "",
      videoModel: "sora-2",
      supabaseUrl: "",
      supabaseAnonKey: "",
      pollInterval: 10000
    });
  }
}

function isOpenAiBaseUrl(url) {
  return (url || "").toLowerCase().includes("api.openai.com");
}

function getDefaultImageModelForBaseUrl(url) {
  return isOpenAiBaseUrl(url) ? DEFAULT_OPENAI_IMAGE_MODEL : DEFAULT_COMPAT_IMAGE_MODEL;
}

function normalizeSettings(settings = {}) {
  var gptApiBaseUrl = (settings.gptApiBaseUrl || settings.apiBaseUrl || "https://api.openai.com/v1").replace(/\/+$/, "");
  var fallbackModel = getDefaultImageModelForBaseUrl(gptApiBaseUrl);
  var legacyModel = settings.imageModel;
  var imageModel = !legacyModel || legacyModel === "gpt-image-2"
    ? fallbackModel
    : legacyModel;

  return {
    gptApiKey: settings.gptApiKey || settings.apiKey || "",
    gptApiBaseUrl,
    imageModel,
    geminiApiKey: settings.geminiApiKey || "",
    geminiApiBaseUrl: (settings.geminiApiBaseUrl || "https://generativelanguage.googleapis.com/v1beta").replace(/\/+$/, ""),
    geminiImageModel: settings.geminiImageModel || "gemini-2.0-flash-preview-image-generation",
    falApiKey: settings.falApiKey || "",
    falApiBaseUrl: (settings.falApiBaseUrl || "https://fal.run").replace(/\/+$/, ""),
    falImageModel: settings.falImageModel || "openai/gpt-image-2/edit",
    falImageSize: settings.falImageSize || "auto",
    falQuality: settings.falQuality || "high",
    backendApiBaseUrl: (settings.backendApiBaseUrl || "http://localhost:3010").replace(/\/+$/, ""),
    customProviderName: settings.customProviderName || "",
    customApiBaseUrl: (settings.customApiBaseUrl || "").replace(/\/+$/, ""),
    customApiKey: settings.customApiKey || "",
    customImageModel: settings.customImageModel || "",
    xaiApiKey: settings.xaiApiKey || "",
    videoModel: settings.videoModel || "grok-imagine-video",
    supabaseUrl: settings.supabaseUrl || "",
    supabaseAnonKey: settings.supabaseAnonKey || "",
    pollInterval: Math.max(2000, Number(settings.pollInterval) || 10000)
  };
}

async function callChatCompletion({
  systemPrompt,
  userPrompt,
  model = "gpt-4.1-mini",
  temperature = 0.7
}) {
  var settings = getSettings();
  var apiKey = settings.gptApiKey || settings.apiKey;
  var apiBaseUrl = settings.gptApiBaseUrl || settings.apiBaseUrl || "https://api.openai.com/v1";
  if (!apiKey) {
    throw new Error("API key belum diisi di menu Admin.");
  }

  var response = await fetch(`${apiBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    })
  });

  var payload = await readResponsePayload(response, "Permintaan GPT gagal.");
  if (!response.ok) {
    throw new Error(getPayloadErrorMessage(payload, "Permintaan GPT gagal."));
  }

  var content = payload?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("GPT tidak mengembalikan konten.");
  }

  return content;
}

function getBackendApiBaseUrl() {
  var settings = getSettings();
  var configured = String(settings.backendApiBaseUrl || "").trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }
  if (window.location && /^https?:$/i.test(window.location.protocol || "")) {
    return String(window.location.origin || "").replace(/\/+$/, "");
  }
  return "http://localhost:3010";
}

function ensureBackendGatewayField() {
  if (els.backendApiBaseUrl) {
    return;
  }
  var anchor = els.customProviderName && els.customProviderName.closest ? els.customProviderName.closest(".gi-field") : null;
  var grid = anchor && anchor.parentElement;
  if (!grid) {
    return;
  }
  var field = document.createElement("label");
  field.className = "gi-field";
  field.innerHTML = '<span class="gi-label">Backend API Base</span><input id="backendApiBaseUrl" placeholder="http://localhost:3010">';
  grid.insertBefore(field, anchor);
  els.backendApiBaseUrl = document.getElementById("backendApiBaseUrl");
}

async function postBackendJson(path, payload, fallbackMessage) {
  var response = await fetch(`${getBackendApiBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload || {})
  });
  var data = await readResponsePayloadOrText(response, fallbackMessage);
  if (!response.ok || data?.ok === false) {
    throw new Error(getPayloadErrorMessage(data, fallbackMessage));
  }
  return data;
}

async function serializeFilesForBackend(files, maxFiles) {
  return Promise.all((files || []).slice(0, maxFiles || 5).map(async (file) => ({
    name: file.name,
    dataUrl: await fileToDataUrl(file)
  })));
}

async function backendEnhanceImagePrompt(rawPrompt, contextLabel) {
  try {
    var data = await postBackendJson("/api/ai/prompt/enhance", {
      rawPrompt,
      contextLabel
    }, "Enhance prompt via backend gagal.");
    var text = String(data?.output?.text || "").trim();
    if (!text) {
      throw new Error("Backend tidak mengembalikan prompt akhir.");
    }
    return text;
  } catch (error) {
    return callChatCompletion({
      systemPrompt: "You rewrite prompts into concise production-ready prompts. Return only the final prompt text.",
      userPrompt: String(rawPrompt || "").trim(),
      temperature: 0.3
    });
  }
}

function dataUrlToFileForFallback(dataUrl, fileName) {
  var match = String(dataUrl || "").match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error(`Data URL tidak valid untuk ${fileName || "image.png"}`);
  }
  var mime = String(match[1] || "application/octet-stream");
  var binary = atob(match[2]);
  var bytes = new Uint8Array(binary.length);
  for (var index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new File([bytes], fileName || "image.png", { type: mime });
}

function buildDirectImagePrompt(feature, payload) {
  payload = payload || {};
  if (feature === "listing") {
    return [
      `Product selling points: ${payload.sellingPoints || "-"}`,
      `Variation ${payload.variation || 1} of ${payload.quantity || 1}.`,
      `Language: ${payload.language || "Indonesia"}`,
      payload.basePrompt || "",
      payload.extraPrompt || ""
    ].filter(Boolean).join("\n");
  }
  if (feature === "multi_angle") {
    return [
      "Create a product image for this exact angle.",
      `Aspect ratio: ${payload.aspectRatio || "auto"}`,
      `Selling points: ${payload.sellingPoints || "-"}`,
      `Template direction: ${payload.basePrompt || "-"}`,
      `Angle name: ${payload.angleName || "Front"}`,
      `Custom prompt: ${payload.extraPrompt || "-"}`,
      `Language: ${payload.language || "Indonesia"}`,
      "Keep lighting, scale, background, and product proportions consistent."
    ].filter(Boolean).join("\n");
  }
  if (feature === "bgremove") {
    return [
      "Remove the background from this product image.",
      `Cutout model: ${payload.cutoutModel || "-"}`,
      `Resolution: ${payload.resolution || "-"}`,
      `Output format: ${payload.outputFormat || "-"}`,
      `Refine foreground: ${payload.refine ? "enabled" : "disabled"}`,
      `Prompt preset: ${payload.basePrompt || "-"}`,
      `Language: ${payload.language || "Indonesia"}`,
      "Return a clean isolated product with preserved edges."
    ].filter(Boolean).join("\n");
  }
  return [
    payload.basePrompt || "",
    payload.extraPrompt || "",
    payload.designRequirements || "",
    payload.sellingPoints || "",
    payload.moduleLabel ? `Module: ${payload.moduleLabel}` : ""
  ].filter(Boolean).join("\n");
}

function buildDirectImageCandidates() {
  var settings = getSettings();
  var candidates = [];
  if (settings.customApiBaseUrl && (settings.customApiKey || settings.gptApiKey || settings.apiKey)) {
    candidates.push({
      kind: "openai",
      imageRequest: resolveImageRequestSettings("custom")
    });
  }
  if (settings.gptApiKey || settings.apiKey) {
    candidates.push({
      kind: "openai",
      imageRequest: resolveImageRequestSettings(settings.imageModel)
    });
  }
  if (settings.geminiApiKey) {
    candidates.push({
      kind: "gemini",
      imageRequest: {
        apiKey: settings.geminiApiKey,
        apiBaseUrl: settings.geminiApiBaseUrl || "https://generativelanguage.googleapis.com/v1beta",
        model: settings.geminiImageModel || "gemini-2.0-flash-preview-image-generation"
      }
    });
  }
  if (settings.falApiKey) {
    candidates.push({
      kind: "fal",
      imageRequest: {
        apiKey: settings.falApiKey,
        apiBaseUrl: settings.falApiBaseUrl || "https://fal.run",
        model: settings.falImageModel || "openai/gpt-image-2/edit",
        imageSize: settings.falImageSize || "auto",
        quality: settings.falQuality || "high"
      }
    });
  }
  return candidates.filter(function(candidate, index, arr){
    return candidate.imageRequest && candidate.imageRequest.apiKey && arr.findIndex(function(other){
      return other.kind === candidate.kind
        && other.imageRequest.apiBaseUrl === candidate.imageRequest.apiBaseUrl
        && other.imageRequest.model === candidate.imageRequest.model;
    }) === index;
  });
}

async function directGenerateImage(feature, payload) {
  var prompt = buildDirectImagePrompt(feature, payload);
  var files = (Array.isArray(payload?.images) ? payload.images : []).map(function(file, index){
    return dataUrlToFileForFallback(file.dataUrl, file.name || `image-${index + 1}.png`);
  });
  if (!files.length) {
    throw new Error("Gambar referensi belum tersedia.");
  }
  var size = payload?.imageSize || payload?.aspectRatio || "auto";
  var candidates = buildDirectImageCandidates();
  if (!candidates.length) {
    throw new Error("Backend tidak aktif dan belum ada API key gambar yang siap dipakai.");
  }
  var lastError = null;
  for (var index = 0; index < candidates.length; index += 1) {
    var candidate = candidates[index];
    try {
      var src = "";
      if (candidate.kind === "gemini") {
        src = await callGeminiImageGeneration(candidate.imageRequest, prompt, files);
      } else if (candidate.kind === "fal") {
        src = await callFalGptImage2Edit(candidate.imageRequest, prompt, files, size);
      } else {
        src = await callOpenAiResponsesImageGeneration(candidate.imageRequest, prompt, files, size);
      }
      return {
        cached: false,
        prompt: prompt,
        task: {
          provider: `${candidate.kind}-direct`,
          model: candidate.imageRequest.model || ""
        },
        images: [{ src: src }]
      };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("Generate image gagal.");
}

async function backendGenerateImage(feature, payload) {
  try {
    var data = await postBackendJson("/api/ai/generate-image", Object.assign({
      feature
    }, payload || {}), "Generate image via backend gagal.");
    var images = Array.isArray(data?.output?.images) ? data.output.images : [];
    if (!images.length || !images[0].src) {
      throw new Error("Backend tidak mengembalikan hasil gambar.");
    }
    return {
      cached: !!data.cached,
      prompt: String(data.prompt || "").trim(),
      task: data.task || {},
      images
    };
  } catch (error) {
    return directGenerateImage(feature, payload || {});
  }
}

async function readResponsePayload(response, fallbackMessage) {
  var text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    var shortText = text.replace(/\s+/g, " ").trim().slice(0, 180);
    var statusText = response.status ? `HTTP ${response.status}${response.statusText ? " " + response.statusText : ""}` : "";
    throw new Error([statusText, shortText || fallbackMessage].filter(Boolean).join(": "));
  }
}

function getPayloadErrorMessage(payload, fallbackMessage) {
  return payload?.error?.message || payload?.message || payload?.detail || payload?.__rawMessage || fallbackMessage;
}

async function readResponsePayloadOrText(response, fallbackMessage) {
  var text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    var shortText = text.replace(/\s+/g, " ").trim().slice(0, 180);
    var statusText = response.status ? `HTTP ${response.status}${response.statusText ? " " + response.statusText : ""}` : "";
    return {
      __rawMessage: [statusText, shortText || fallbackMessage].filter(Boolean).join(": ")
    };
  }
}

function fileToGeminiPart(file) {
  return new Promise((resolve, reject) => {
    var reader = new FileReader();
    reader.onload = () => {
      var dataUrl = String(reader.result || "");
      var base64 = dataUrl.includes(",") ? dataUrl.split(",").pop() : dataUrl;
      resolve({
        inlineData: {
          mimeType: file.type || "image/png",
          data: base64
        }
      });
    };
    reader.onerror = () => reject(new Error("Gagal membaca gambar untuk Gemini."));
    reader.readAsDataURL(file);
  });
}

function extractGeminiImage(payload) {
  var parts = payload?.candidates?.flatMap((candidate) => candidate?.content?.parts || []) || [];
  var imagePart = parts.find((part) => part?.inlineData?.data || part?.inline_data?.data);
  return imagePart?.inlineData?.data || imagePart?.inline_data?.data || "";
}

async function callGeminiImageGeneration(imageRequest, prompt, files) {
  var imageParts = await Promise.all(files.map(fileToGeminiPart));
  var geminiModel = String(imageRequest.model || "").replace(/^models\//, "");
  var response = await fetch(`${imageRequest.apiBaseUrl}/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(imageRequest.apiKey)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            ...imageParts
          ]
        }
      ],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"]
      }
    })
  });

  var payload = await readResponsePayload(response, "Generate image Gemini gagal.");
  if (!response.ok) {
    throw new Error(getPayloadErrorMessage(payload, "Generate image Gemini gagal."));
  }

  var base64Image = extractGeminiImage(payload);
  if (!base64Image) {
    throw new Error("Response Gemini tidak berisi hasil gambar.");
  }

  return `data:image/png;base64,${base64Image}`;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    var reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Gagal membaca gambar referensi."));
    reader.readAsDataURL(file);
  });
}

function extractResponsesImage(payload) {
  var output = Array.isArray(payload?.output) ? payload.output : [];
  var direct = output.find((item) => item?.type === "image_generation_call" && item?.result);
  if (direct?.result) {
    return direct.result;
  }
  var nested = output
    .flatMap((item) => Array.isArray(item?.content) ? item.content : [])
    .find((item) => item?.type === "image_generation_call" && item?.result);
  return nested?.result || "";
}

function getResponsesTextModel() {
  return "gpt-5.5";
}

async function callOpenAiResponsesImageGeneration(imageRequest, prompt, files, size) {
  var imageUrls = await Promise.all(files.map(fileToDataUrl));
  var content = [
    { type: "input_text", text: prompt },
    ...imageUrls.map((imageUrl) => ({ type: "input_image", image_url: imageUrl }))
  ];
  var tool = {
    type: "image_generation",
    quality: "high"
  };
  if (size && size !== "auto") {
    tool.size = size;
  }
  if (imageRequest.model) {
    tool.model = imageRequest.model;
  }

  var response = await fetch(`${imageRequest.apiBaseUrl}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${imageRequest.apiKey}`
    },
    body: JSON.stringify({
      model: getResponsesTextModel(),
      input: [
        {
          role: "user",
          content
        }
      ],
      tools: [tool]
    })
  });
  var payload = await readResponsePayloadOrText(response, "Generate image Responses API gagal.");
  if (!response.ok) {
    throw new Error(getPayloadErrorMessage(payload, "Generate image Responses API gagal."));
  }
  var base64Image = extractResponsesImage(payload);
  if (!base64Image) {
    throw new Error("Responses API tidak mengembalikan image_generation_call.");
  }
  return `data:image/png;base64,${base64Image}`;
}

function mapFalImageSize(size, fallback) {
  if (fallback && fallback !== "auto") {
    return fallback;
  }
  var map = {
    "1024x1024": "square",
    "1536x1024": "landscape_4_3",
    "1024x1536": "portrait_4_3",
    auto: "auto"
  };
  return map[size] || "auto";
}

async function callFalGptImage2Edit(imageRequest, prompt, files, size) {
  var imageUrls = await Promise.all(files.map(fileToDataUrl));
  var response = await fetch(`${(imageRequest.apiBaseUrl || "https://fal.run").replace(/\/+$/, "")}/${imageRequest.model || "openai/gpt-image-2/edit"}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${imageRequest.apiKey}`
    },
    body: JSON.stringify({
      prompt,
      image_urls: imageUrls,
      image_size: mapFalImageSize(size, imageRequest.imageSize),
      quality: imageRequest.quality || "high",
      num_images: 1,
      output_format: "png",
      sync_mode: false
    })
  });
  var payload = await readResponsePayloadOrText(response, "Generate image Fal.ai gagal.");
  if (!response.ok) {
    throw new Error(getPayloadErrorMessage(payload, "Generate image Fal.ai gagal."));
  }
  var url = payload?.images?.[0]?.url || payload?.image?.url || payload?.url || "";
  if (!url) {
    throw new Error("Fal.ai tidak mengembalikan URL gambar.");
  }
  try {
    var imageResponse = await fetch(url);
    if (!imageResponse.ok) {
      return url;
    }
    var blob = await imageResponse.blob();
    return URL.createObjectURL(blob);
  } catch {
    return url;
  }
}

async function callBestOpenAiImageGeneration(imageRequest, prompt, files, size, preferWebLike) {
  if (imageRequest.provider === "fal") {
    return callFalGptImage2Edit(imageRequest, prompt, files, size);
  }
  if (preferWebLike && imageRequest.provider === "gpt" && isOpenAiBaseUrl(imageRequest.apiBaseUrl)) {
    try {
      return await callOpenAiResponsesImageGeneration(imageRequest, prompt, files, size);
    } catch (error) {
      console.warn("Responses image_generation fallback to Image API:", error);
    }
  }
  return callOpenAiCompatibleImageEdit(imageRequest, prompt, files, size);
}

async function callOpenAiCompatibleImageEdit(imageRequest, prompt, files, size) {
  async function sendEditRequest(imageFieldName, includeQuality) {
    var formData = new FormData();
    formData.append("model", imageRequest.model);
    formData.append("prompt", prompt);
    if (includeQuality) {
      formData.append("quality", "high");
      formData.append("input_fidelity", "high");
    }
    if (size && size !== "auto") {
      formData.append("size", size);
    }

    files.forEach((file) => {
      formData.append(imageFieldName, file, file.name);
    });

    var response = await fetch(`${imageRequest.apiBaseUrl}/images/edits`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${imageRequest.apiKey}`
      },
      body: formData
    });

    var payload = await readResponsePayloadOrText(response, "Generate image gagal.");
    return { response, payload };
  }

  var result = await sendEditRequest("image[]", true);
  if (!result.response.ok) {
    var retryResult = await sendEditRequest("image", false);
    if (retryResult.response.ok) {
      result = retryResult;
    } else {
      var firstMessage = getPayloadErrorMessage(result.payload, "Generate image gagal.");
      var retryMessage = getPayloadErrorMessage(retryResult.payload, "Generate image gagal.");
      throw new Error(normalizeImageErrorMessage(`Generate image gagal. Format utama: ${firstMessage}. Retry image field: ${retryMessage}`));
    }
  }

  var base64Image = result.payload?.data?.[0]?.b64_json;
  if (!base64Image) {
    throw new Error("Response tidak berisi hasil gambar.");
  }

  return `data:image/png;base64,${base64Image}`;
}

function loadSettingsIntoForm() {
  var settings = getSettings();
  els.gptApiKey.value = settings.gptApiKey || settings.apiKey || "";
  els.gptApiBaseUrl.value = settings.gptApiBaseUrl || settings.apiBaseUrl || "https://api.openai.com/v1";
  els.geminiApiKey.value = settings.geminiApiKey || "";
  els.geminiApiBaseUrl.value = settings.geminiApiBaseUrl || "https://generativelanguage.googleapis.com/v1beta";
  els.geminiImageModel.value = settings.geminiImageModel || "gemini-2.0-flash-preview-image-generation";
  if (els.falApiKey) els.falApiKey.value = settings.falApiKey || "";
  if (els.falApiBaseUrl) els.falApiBaseUrl.value = settings.falApiBaseUrl || "https://fal.run";
  if (els.falImageModel) els.falImageModel.value = settings.falImageModel || "openai/gpt-image-2/edit";
  if (els.falImageSize) els.falImageSize.value = settings.falImageSize || "auto";
  if (els.falQuality) els.falQuality.value = settings.falQuality || "high";
  if (els.backendApiBaseUrl) els.backendApiBaseUrl.value = settings.backendApiBaseUrl || "http://localhost:3010";
  els.customProviderName.value = settings.customProviderName || "";
  els.customApiBaseUrl.value = settings.customApiBaseUrl || "";
  els.customApiKey.value = settings.customApiKey || "";
  els.customImageModel.value = settings.customImageModel || "";
  if (els.xaiApiKey) els.xaiApiKey.value = settings.xaiApiKey || "";
  els.videoModel.value = settings.videoModel || "grok-imagine-video";
  els.supabaseUrl.value = settings.supabaseUrl || "";
  els.supabaseAnonKey.value = settings.supabaseAnonKey || "";
  els.pollInterval.value = settings.pollInterval || 10000;
}

function updateApiStatus() {
  var settings = getSettings();
  var hasApiKey = Boolean(settings.gptApiKey || settings.geminiApiKey || settings.falApiKey || settings.customApiKey || settings.xaiApiKey || settings.apiKey);
  els.apiStatus.textContent = hasApiKey ? "API siap digunakan" : "API belum disetel";
  els.apiStatus.classList.toggle("ready", hasApiKey);
}

function saveSettings() {
  var settings = normalizeSettings({
    gptApiKey: els.gptApiKey.value.trim(),
    gptApiBaseUrl: (els.gptApiBaseUrl.value.trim() || "https://api.openai.com/v1").replace(/\/+$/, ""),
    imageModel: els.customApiBaseUrl.value.trim() && els.customApiKey.value.trim() ? "custom" : getDefaultImageModelForBaseUrl(els.gptApiBaseUrl.value.trim() || "https://api.openai.com/v1"),
    geminiApiKey: els.geminiApiKey.value.trim(),
    geminiApiBaseUrl: (els.geminiApiBaseUrl.value.trim() || "https://generativelanguage.googleapis.com/v1beta").replace(/\/+$/, ""),
    geminiImageModel: els.geminiImageModel.value.trim() || "gemini-2.0-flash-preview-image-generation",
    falApiKey: els.falApiKey?.value.trim() || "",
    falApiBaseUrl: (els.falApiBaseUrl?.value.trim() || "https://fal.run").replace(/\/+$/, ""),
    falImageModel: els.falImageModel?.value.trim() || "openai/gpt-image-2/edit",
    falImageSize: els.falImageSize?.value || "auto",
    falQuality: els.falQuality?.value || "high",
    backendApiBaseUrl: (els.backendApiBaseUrl?.value.trim() || "http://localhost:3010").replace(/\/+$/, ""),
    customProviderName: els.customProviderName.value.trim(),
    customApiBaseUrl: els.customApiBaseUrl.value.trim().replace(/\/+$/, ""),
    customApiKey: els.customApiKey.value.trim(),
    customImageModel: els.customImageModel.value.trim(),
    xaiApiKey: els.xaiApiKey?.value.trim() || "",
    videoModel: els.videoModel.value.trim() || "grok-imagine-video",
    supabaseUrl: els.supabaseUrl.value.trim(),
    supabaseAnonKey: els.supabaseAnonKey.value.trim(),
    pollInterval: Math.max(2000, Number(els.pollInterval.value) || 10000)
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  updateApiStatus();
  syncAllImageControls();
  updateAllEstimateBadges();
}

function resolveImageModel(selectedValue) {
  var settings = getSettings();
  if (selectedValue === "custom") {
    return settings.customImageModel || settings.imageModel || DEFAULT_COMPAT_IMAGE_MODEL;
  }
  if (selectedValue === "gpt-image-2") {
    return getDefaultImageModelForBaseUrl(settings.gptApiBaseUrl);
  }
  if (selectedValue === "gpt-4o") {
    return DEFAULT_OPENAI_IMAGE_MODEL;
  }
  return selectedValue || settings.imageModel || getDefaultImageModelForBaseUrl(settings.gptApiBaseUrl);
}

function resolveImageRequestSettings(selectedValue) {
  var settings = getSettings();
  if (selectedValue === "custom") {
    return {
      apiKey: settings.customApiKey || settings.gptApiKey || settings.apiKey || "",
      apiBaseUrl: settings.customApiBaseUrl || settings.gptApiBaseUrl || settings.apiBaseUrl || "https://api.openai.com/v1",
      model: resolveImageModel(selectedValue)
    };
  }

  return {
    apiKey: settings.gptApiKey || settings.apiKey || "",
    apiBaseUrl: settings.gptApiBaseUrl || settings.apiBaseUrl || "https://api.openai.com/v1",
    model: resolveImageModel(selectedValue)
  };
}

function imageModelOptions(provider) {
  var settings = getSettings();
  if (provider === "gpt") {
    return [
      { value: "gpt-image-2", label: "GPT Image 2 / ChatGPT-like" },
      { value: "gpt-image-1.5", label: "GPT Image 1.5" },
      { value: "gpt-image-1", label: "GPT Image 1" },
      { value: "gpt-image-1-mini", label: "GPT Image 1 Mini" },
      { value: "dall-e-3", label: "DALL-E 3" },
      { value: "dall-e-2", label: "DALL-E 2" }
    ];
  }
  if (provider === "gemini") {
    var geminiModel = settings.geminiImageModel || "gemini-2.0-flash-preview-image-generation";
    return [
      { value: geminiModel, label: geminiModel + " (Gemini default)" },
      { value: "gemini-2.0-flash-preview-image-generation", label: "gemini-2.0-flash-preview-image-generation" },
      { value: "gemini-2.5-flash-image-preview", label: "gemini-2.5-flash-image-preview" }
    ].filter(function(item, index, arr){
      return arr.findIndex(function(other){ return other.value === item.value; }) === index;
    });
  }
  if (provider === "fal") {
    var falModel = settings.falImageModel || "openai/gpt-image-2/edit";
    return [
      { value: falModel, label: falModel + " (Fal default)" },
      { value: "openai/gpt-image-2/edit", label: "openai/gpt-image-2/edit" }
    ].filter(function(item, index, arr){
      return arr.findIndex(function(other){ return other.value === item.value; }) === index;
    });
  }
  var customModel = settings.customImageModel || DEFAULT_COMPAT_IMAGE_MODEL;
  return [
    { value: customModel, label: customModel + " (Custom default)" },
    { value: "cx/gpt-5.5", label: "cx/gpt-5.5" },
    { value: "nano-banana-pro", label: "nano-banana-pro" },
    { value: DEFAULT_COMPAT_IMAGE_MODEL, label: DEFAULT_COMPAT_IMAGE_MODEL }
  ].filter(function(item, index, arr){
    return arr.findIndex(function(other){ return other.value === item.value; }) === index;
  });
}

function syncListingImageControls() {
  syncImageControls(els.listingProvider, els.listingImageModel);
}

function syncImageControls(providerEl, modelEl) {
  if (!providerEl || !modelEl) {
    return;
  }
  var settings = getSettings();
  var preferredProvider = settings.customApiBaseUrl && settings.customApiKey ? "custom" : (settings.gptApiKey || settings.apiKey ? "gpt" : "gemini");
  if (!providerEl.value) {
    providerEl.value = preferredProvider;
  }
  var provider = providerEl.value || preferredProvider;
  var previous = modelEl.value || settings.customImageModel || settings.geminiImageModel || settings.imageModel || "";
  var options = imageModelOptions(provider);
  modelEl.innerHTML = options.map(function(item){
    return '<option value="'+item.value+'">'+item.label+'</option>';
  }).join("");
  var preferred = options.some(function(item){ return item.value === previous; }) ? previous : options[0].value;
  modelEl.value = preferred;
}

function syncAllImageControls() {
  syncImageControls(els.listingProvider, els.listingImageModel);
  syncImageControls(els.aplusProvider, els.aplusImageModel);
  syncImageControls(els.multiProvider, els.multiImageModel);
  syncImageControls(els.bgremoveProvider, els.bgremoveImageModel);
}

function resolveListingImageRequestSettings() {
  return resolveFeatureImageRequestSettings(els.listingProvider, els.listingImageModel);
}

function resolveFeatureImageRequestSettings(providerEl, modelEl) {
  var settings = getSettings();
  var provider = providerEl ? (providerEl.value || "custom") : "custom";
  var model = modelEl ? modelEl.value : "";
  if (provider === "gpt") {
    return {
      provider,
      apiKey: settings.gptApiKey || settings.apiKey || "",
      apiBaseUrl: settings.gptApiBaseUrl || settings.apiBaseUrl || "https://api.openai.com/v1",
      model: model || settings.imageModel || DEFAULT_OPENAI_IMAGE_MODEL
    };
  }
  if (provider === "gemini") {
    return {
      provider,
      apiKey: settings.geminiApiKey || "",
      apiBaseUrl: settings.geminiApiBaseUrl || "https://generativelanguage.googleapis.com/v1beta",
      model: model || settings.geminiImageModel || "gemini-2.0-flash-preview-image-generation"
    };
  }
  if (provider === "fal") {
    return {
      provider,
      apiKey: settings.falApiKey || "",
      apiBaseUrl: settings.falApiBaseUrl || "https://fal.run",
      model: model || settings.falImageModel || "openai/gpt-image-2/edit",
      imageSize: settings.falImageSize || "auto",
      quality: settings.falQuality || "high"
    };
  }
  return {
    provider,
    apiKey: settings.customApiKey || settings.gptApiKey || settings.apiKey || "",
    apiBaseUrl: settings.customApiBaseUrl || settings.gptApiBaseUrl || settings.apiBaseUrl || "https://api.openai.com/v1",
    model: model || settings.customImageModel || settings.imageModel || DEFAULT_COMPAT_IMAGE_MODEL
  };
}

function normalizeImageErrorMessage(message) {
  if (!message) {
    return "Generate image gagal.";
  }

  if (message.toLowerCase().includes("organization must be verified")) {
    return "Model sebelumnya membutuhkan organisasi OpenAI yang sudah diverifikasi. Sistem sudah dialihkan ke model gambar default yang lebih aman. Silakan generate ulang.";
  }

  return message;
}

async function testApiConnection(kind) {
  var settings = getSettings();
  if (kind === "gpt") {
    var apiBaseUrl = settings.gptApiBaseUrl || "https://api.openai.com/v1";
    var apiKey = settings.gptApiKey || "";
    if (!apiKey) {
      throw new Error("API key GPT belum diisi.");
    }
    var response = await fetch(`${apiBaseUrl}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    if (!response.ok) {
      var payload = await readResponsePayload(response, "Koneksi GPT gagal.");
      throw new Error("Gagal: " + getPayloadErrorMessage(payload, "Koneksi GPT gagal."));
    }
    return "Sukses: Koneksi GPT berhasil.";
  }

  if (kind === "gemini") {
    var apiBaseUrl = settings.geminiApiBaseUrl || "https://generativelanguage.googleapis.com/v1beta";
    var apiKey = settings.geminiApiKey || "";
    if (!apiKey) {
      throw new Error("API key Gemini belum diisi.");
    }
    var response = await fetch(`${apiBaseUrl}/models?key=${encodeURIComponent(apiKey)}`);
    if (!response.ok) {
      var payload = await readResponsePayload(response, "Koneksi Gemini gagal.");
      throw new Error("Gagal: " + getPayloadErrorMessage(payload, "Koneksi Gemini gagal."));
    }
    return "Sukses: Koneksi Gemini berhasil.";
  }

  if (kind === "fal") {
    var falBaseUrl = settings.falApiBaseUrl || "https://fal.run";
    var falKey = settings.falApiKey || "";
    if (!falKey) {
      throw new Error("API key Fal.ai belum diisi.");
    }
    return "Fal.ai key tersimpan. Test generate dilakukan saat menjalankan model openai/gpt-image-2/edit.";
  }

  var apiBaseUrl = settings.customApiBaseUrl || "";
  var apiKey = settings.customApiKey || "";
  if (!apiBaseUrl || !apiKey) {
    throw new Error("API custom belum lengkap.");
  }
  var response = await fetch(`${apiBaseUrl}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  if (!response.ok) {
    var payload = await readResponsePayload(response, "Koneksi custom provider gagal.");
    throw new Error("Gagal: " + getPayloadErrorMessage(payload, "Koneksi custom provider gagal."));
  }
  return "Sukses: Koneksi custom provider berhasil.";
}

function clearSettings() {
  localStorage.removeItem(STORAGE_KEY);
  loadSettingsIntoForm();
  updateApiStatus();
  syncAllImageControls();
}

function loadFolderLibrary() {
  var raw = localStorage.getItem(FOLDER_STORAGE_KEY);
  if (!raw) {
    return;
  }

  try {
    var parsed = JSON.parse(raw);
    state.folders.listing = Array.isArray(parsed.listing)
      ? parsed.listing.map((item) => ({
          ...item,
          src: item?.src?.startsWith("data:") ? "" : item?.src || ""
        }))
      : [];
    state.folders.multi = Array.isArray(parsed.multi)
      ? parsed.multi.map((item) => ({
          ...item,
          src: item?.src?.startsWith("data:") ? "" : item?.src || ""
        }))
      : [];
    state.folders.aplus = Array.isArray(parsed.aplus)
      ? parsed.aplus.map((item) => ({
          ...item,
          src: item?.src?.startsWith("data:") ? "" : item?.src || ""
        }))
      : [];
    saveFolderLibrary();
  } catch {
    state.folders = { listing: [], multi: [], aplus: [] };
  }
}

function saveFolderLibrary() {
  localStorage.setItem(FOLDER_STORAGE_KEY, JSON.stringify(state.folders));
}

function loadBrandInfo() {
  var raw = localStorage.getItem(BRAND_INFO_STORAGE_KEY);
  if (!raw) {
    state.brandInfo = { ...defaultBrandInfo };
    return;
  }

  try {
    var parsed = JSON.parse(raw);
    state.brandInfo = {
      name: parsed.name || "",
      logoDataUrl: parsed.logoDataUrl || "",
      productCategory: parsed.productCategory || "",
      storeReputation: parsed.storeReputation || "",
      description: parsed.description || ""
    };
  } catch {
    state.brandInfo = { ...defaultBrandInfo };
  }
}

function saveBrandInfo() {
  localStorage.setItem(BRAND_INFO_STORAGE_KEY, JSON.stringify(state.brandInfo));
}

function renderBrandInfo() {
  if (els.brandName) {
    els.brandName.value = state.brandInfo.name || "";
  }
  if (els.brandProductCategory) {
    els.brandProductCategory.value = state.brandInfo.productCategory || "";
  }
  if (els.brandStoreReputation) {
    els.brandStoreReputation.value = state.brandInfo.storeReputation || "";
  }
  if (els.brandDescription) {
    els.brandDescription.value = state.brandInfo.description || "";
  }

  var logo = state.brandInfo.logoDataUrl || "";
  if (els.brandLogoPreview) {
    if (logo) {
      els.brandLogoPreview.src = logo;
      els.brandLogoPreview.classList.remove("hidden");
    } else {
      els.brandLogoPreview.removeAttribute("src");
      els.brandLogoPreview.classList.add("hidden");
    }
  }

  if (els.brandReferenceLogo && els.brandReferenceLogoPlaceholder) {
    if (logo) {
      els.brandReferenceLogo.src = logo;
      els.brandReferenceLogo.classList.remove("hidden");
      els.brandReferenceLogoPlaceholder.classList.add("hidden");
    } else {
      els.brandReferenceLogo.removeAttribute("src");
      els.brandReferenceLogo.classList.add("hidden");
      els.brandReferenceLogoPlaceholder.classList.remove("hidden");
    }
  }

  if (els.brandReferenceName) {
    els.brandReferenceName.textContent = state.brandInfo.name || "Belum ada nama brand";
  }

  if (els.brandReferenceMeta) {
    var meta = [
      state.brandInfo.productCategory ? `Kategori: ${state.brandInfo.productCategory}` : "",
      state.brandInfo.storeReputation ? `Reputasi: ${state.brandInfo.storeReputation}` : ""
    ].filter(Boolean).join(" • ");
    els.brandReferenceMeta.textContent = meta || "Tambahkan kategori produk dan reputasi toko untuk memperkaya konteks generate.";
  }

  if (els.brandReferencePrompt) {
    els.brandReferencePrompt.textContent = buildBrandInformationBlock() || "Brand context belum diisi.";
  }
}

function collectBrandInfoFromForm() {
  state.brandInfo = {
    ...state.brandInfo,
    name: els.brandName?.value.trim() || "",
    productCategory: els.brandProductCategory?.value.trim() || "",
    storeReputation: els.brandStoreReputation?.value.trim() || "",
    description: els.brandDescription?.value.trim() || ""
  };
}

function buildBrandInformationBlock() {
  var parts = [
    state.brandInfo.name ? `Brand name: ${state.brandInfo.name}` : "",
    state.brandInfo.productCategory ? `Product category: ${state.brandInfo.productCategory}` : "",
    state.brandInfo.storeReputation ? `Store reputation: ${state.brandInfo.storeReputation}` : "",
    state.brandInfo.description ? `Additional brand description: ${state.brandInfo.description}` : ""
  ].filter(Boolean);

  if (!parts.length) {
    return "";
  }

  return `Brand information reference:
${parts.join("\n")}`;
}

function clearBrandInfo() {
  state.brandInfo = { ...defaultBrandInfo };
  saveBrandInfo();
  renderBrandInfo();
  if (els.brandLogo) {
    els.brandLogo.value = "";
  }
  if (els.brandStatus) {
    els.brandStatus.textContent = "Brand information direset.";
  }
}

function loadPromptStore() {
  var raw = localStorage.getItem(PROMPT_STORAGE_KEY);
  if (!raw) {
    state.promptStore = buildDefaultPromptState();
    state.promptPropertySchemas = buildDefaultPromptPropertySchemas();
    state.promptManualImages = [];
    state.corePrompt = "";
    return;
  }

  try {
    var parsed = JSON.parse(raw);
    state.promptStore = normalizeLoadedPromptStore(parsed);
    state.promptPropertySchemas = normalizeLoadedPromptPropertySchemas(parsed);
    state.promptManualImages = normalizeLoadedPromptManualImages(parsed);
    var parsedSource = parsed?.promptStore && typeof parsed.promptStore === "object" ? parsed.promptStore : parsed;
    if (!hasAnyPromptRows(parsedSource)) {
      savePromptStore();
    }
    state.corePrompt = "";
  } catch {
    state.promptStore = buildDefaultPromptState();
    state.promptPropertySchemas = buildDefaultPromptPropertySchemas();
    state.promptManualImages = [];
    state.corePrompt = "";
  }
}

function mergeDefaultAnglePrompts(prompts) {
  var current = Array.isArray(prompts) ? prompts : [];
  var currentKeys = new Set(current.map((prompt) => prompt.key));
  var missingDefaults = defaultPromptStore.multi_angle.filter((prompt) => !currentKeys.has(prompt.key)).map((prompt) => normalizePromptEntry(prompt));
  return [...current, ...missingDefaults];
}

function savePromptStore() {
  var notice = "";
  try {
    localStorage.setItem(PROMPT_STORAGE_KEY, JSON.stringify(buildPromptStorePayload()));
    return true;
  } catch (error) {
    if (!isStorageQuotaError(error)) throw error;
    notice = "Penyimpanan browser penuh. Thumbnail prompt diperkecil otomatis.";
  }
  try {
    localStorage.setItem(PROMPT_STORAGE_KEY, JSON.stringify(buildPromptStorePayload("small-images")));
    if (els.promptStatus && notice) els.promptStatus.textContent = notice;
    return true;
  } catch (error) {
    if (!isStorageQuotaError(error)) throw error;
  }
  try {
    localStorage.setItem(PROMPT_STORAGE_KEY, JSON.stringify(buildPromptStorePayload("no-images")));
    if (els.promptStatus) els.promptStatus.textContent = "Penyimpanan browser penuh. Prompt tersimpan tanpa thumbnail agar generate tetap berjalan.";
    return true;
  } catch (error) {
    console.warn("Prompt store could not be saved", error);
    if (els.promptStatus) els.promptStatus.textContent = "Prompt aktif tetap dipakai, tetapi riwayat prompt tidak bisa disimpan karena storage browser penuh.";
    return false;
  }
}

function getCorePrompt() {
  return "";
}

function slugifyPromptKey(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function getPromptOptions(feature) {
  return state.promptStore[feature] || [];
}

function getAllPromptOptions() {
  return ["listing", "multi_angle", "video", "aplus", "bgremove"].flatMap((feature) => {
    return getPromptOptions(feature).map((prompt) => ({
      ...prompt,
      feature,
      key: `${feature}:${prompt.key}`,
      sourceKey: prompt.key
    }));
  });
}

function getAnglePromptOptions() {
  return getPromptOptions("multi_angle").map((prompt) => ({
    ...prompt,
    feature: "multi_angle",
    key: `angle:${prompt.key}`,
    sourceKey: prompt.key
  }));
}

function getMultiPromptMode() {
  return els.multiTemplate?.value || "angle";
}

function getCurrentMultiPromptOptions() {
  var mode = getMultiPromptMode();
  if (mode === "custom") {
    var content = els.multiPrompt?.value.trim() || "";
    return content ? [{
      key: "custom:prompt",
      sourceKey: "custom",
      feature: "custom",
      title: "Custom Prompt",
      content
    }] : [];
  }
  return mode === "all" ? getAllPromptOptions() : getAnglePromptOptions();
}

function findPromptByKey(feature, key) {
  return getPromptOptions(feature).find((item) => item.key === key);
}

function populateSelectFromPrompts(selectEl, feature, fallbackKey = "") {
  if (!selectEl) {
    return;
  }
  var prompts = getPromptOptions(feature);
  selectEl.innerHTML = prompts
    .map((prompt) => `<option value="${prompt.key}">${prompt.title}</option>`)
    .join("");

  var preferred = prompts.some((item) => item.key === fallbackKey) ? fallbackKey : prompts[0]?.key || "";
  if (preferred) {
    selectEl.value = preferred;
  }
}

function syncPromptSelectors() {
  populateSelectFromPrompts(els.listingTemplate, "listing", els.listingTemplate.value);
  populateSelectFromPrompts(els.aplusPromptPreset, "aplus", els.aplusPromptPreset?.value || "");
  populateSelectFromPrompts(els.bgremovePromptPreset, "bgremove", els.bgremovePromptPreset?.value || "");
  renderMultiPromptList();
}

function renderMultiPromptList() {
  if (!els.multiPromptList) {
    return;
  }
  var mode = getMultiPromptMode();
  if (els.multiPrompt) {
    var wrap = els.multiPrompt.closest(".gi-field");
    if (wrap) {
      wrap.style.display = mode === "custom" ? "grid" : "none";
    }
  }
  var options = getCurrentMultiPromptOptions();
  if (mode === "custom") {
    state.selectedMultiPromptKeys = new Set(options.length ? ["custom:prompt"] : []);
    els.multiPromptList.innerHTML = options.length ? '<div class="gi-muted">Custom prompt siap dipakai sebagai 1 output.</div>' : '<div class="gi-muted">Isi custom prompt untuk membuat 1 output.</div>';
    updateMultiAngleCount();
    return;
  }
  if (!state.selectedMultiPromptTouched && !state.selectedMultiPromptKeys.size) {
    options.slice(0, 9).forEach((prompt) => state.selectedMultiPromptKeys.add(prompt.key));
  }
  var validKeys = new Set(options.map((prompt) => prompt.key));
  state.selectedMultiPromptKeys = new Set(Array.from(state.selectedMultiPromptKeys).filter((key) => validKeys.has(key)));
  els.multiPromptList.innerHTML = options.map((prompt) => {
    var checked = state.selectedMultiPromptKeys.has(prompt.key) ? " checked" : "";
    var sourceLabel = getMultiPromptMode() === "all" ? `${prompt.feature} / ${prompt.sourceKey}` : prompt.sourceKey;
    return `<label class="multi-prompt-chip ${checked ? "active" : ""}" title="${(prompt.content || "").replace(/"/g, "&quot;").slice(0, 240)}"><input type="checkbox" data-multi-prompt-key="${prompt.key}"${checked}> <strong>${prompt.title}</strong><span>${sourceLabel}</span></label>`;
  }).join("");
  updateMultiAngleCount();
  updateAllEstimateBadges();
}

function getSelectedMultiPrompts() {
  var options = getCurrentMultiPromptOptions();
  return options.filter((prompt) => state.selectedMultiPromptKeys.has(prompt.key));
}

function buildVisibleEnhancerInstruction(rawPrompt, contextLabel) {
  return [
    "Rewrite this image-generation prompt into a polished final prompt for GPT image generation.",
    "The result must be a single production-ready prompt that can be shown to the user and sent directly to the image API.",
    "Keep the user's intent. Do not add unrelated objects, hidden brand rules, or secret system instructions.",
    "Improve visual finish so the output feels like ChatGPT web image generation: polished, complete, commercial, realistic, refined lighting, clean composition, not raw.",
    "Return only the final prompt text, no markdown, no explanation.",
    "",
    `Context: ${contextLabel}`,
    "",
    "Original prompt:",
    rawPrompt
  ].join("\n");
}

async function enhanceImagePrompt(rawPrompt, contextLabel) {
  if (!rawPrompt.trim()) {
    throw new Error("Prompt kosong.");
  }
  return backendEnhanceImagePrompt(buildVisibleEnhancerInstruction(rawPrompt, contextLabel), contextLabel);
}

function serializeEnhancedMultiPrompts(entries) {
  return entries.map((entry) => `[${entry.key}] ${entry.title}\n${entry.content}`).join("\n\n---\n\n");
}

function parseEnhancedMultiPromptText(text) {
  var map = {};
  String(text || "")
    .split(/\n---\n/g)
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      var match = part.match(/^\[([^\]]+)\]\s*([^\n]*)\n([\s\S]*)$/);
      if (match) {
        map[match[1]] = match[3].trim();
      }
    });
  return map;
}

function getPromptFeaturesForDatabase() {
  return ["listing", "multi_angle", "video", "aplus", "bgremove"];
}

function getPromptFeatureLabel(feature) {
  return (promptFeatureMeta[feature] && promptFeatureMeta[feature].label) || feature;
}

function renderPromptTagBadge(value, tone) {
  var text = String(value || "").trim();
  if (!text) return `<span style="color:var(--tx3)">-</span>`;
  return `<span style="display:inline-flex;align-items:center;padding:3px 8px;border-radius:999px;background:${tone || "rgba(255,165,0,.12)"};border:1px solid rgba(255,255,255,.08);font-size:10px;font-weight:800;color:#fff">${escapeHtml(text)}</span>`;
}

function getPromptPriorityMeta(prompt) {
  var usage = Number(prompt?.usageCount || 0);
  var rating = Number(prompt?.rating || 0);
  if (usage >= 5) {
    return { label: "Hot", tone: "rgba(18,83,49,.92)", score: 3 };
  }
  if (usage >= 1 || rating >= 4 || prompt?.usePrompt !== false) {
    return { label: "Prioritas", tone: "rgba(20,92,56,.88)", score: 2 };
  }
  return { label: "-", tone: "rgba(255,255,255,.08)", score: 1 };
}

function getPromptByFeaturePair(pair) {
  var parts = String(pair || "").split(":");
  var feature = parts.shift();
  var key = parts.join(":");
  if (!feature || !key) {
    return null;
  }
  var prompt = findPromptByKey(feature, key);
  return prompt ? { feature, key, prompt } : null;
}

function getPromptPropertySchemas(feature) {
  return Array.isArray(state.promptPropertySchemas?.[feature]) ? state.promptPropertySchemas[feature] : [];
}

function getPromptPropertySchema(feature, propertyId) {
  return getPromptPropertySchemas(feature).find((item) => item.id === propertyId) || null;
}

function slugifyPromptPropertyId(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 36) || `property_${Date.now()}`;
}

function openPromptPropertyDialog(feature) {
  if (els.promptPropertyFeature) {
    els.promptPropertyFeature.value = feature || state.activePromptFeature || "listing";
  }
  if (els.promptPropertyName) {
    els.promptPropertyName.value = "";
  }
  if (els.promptPropertyType) {
    els.promptPropertyType.value = "text";
  }
  if (els.promptPropertyOptions) {
    els.promptPropertyOptions.value = "";
  }
  els.promptPropertyDialog?.classList.remove("hidden");
}

function closePromptPropertyDialog() {
  els.promptPropertyDialog?.classList.add("hidden");
}

function createPromptProperty() {
  var feature = els.promptPropertyFeature?.value || "listing";
  var name = String(els.promptPropertyName?.value || "").trim();
  var type = String(els.promptPropertyType?.value || "text").trim();
  var options = String(els.promptPropertyOptions?.value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 24);
  if (!name) {
    els.promptStatus.textContent = "Nama property wajib diisi.";
    return;
  }
  var propertyId = slugifyPromptPropertyId(name);
  var existing = getPromptPropertySchema(feature, propertyId);
  if (existing) {
    els.promptStatus.textContent = "Nama property sudah ada di feature ini.";
    return;
  }
  var next = normalizePromptPropertySchemaItem({ id: propertyId, name, type, options }, getPromptPropertySchemas(feature).length);
  state.promptPropertySchemas[feature] = [...getPromptPropertySchemas(feature), next];
  savePromptStore();
  renderPromptList();
  closePromptPropertyDialog();
  els.promptStatus.textContent = `Property ${name} ditambahkan ke ${getPromptFeatureLabel(feature)}.`;
}

function deletePromptProperty(feature, propertyId) {
  var schema = getPromptPropertySchema(feature, propertyId);
  if (!schema) {
    return;
  }
  state.promptPropertySchemas[feature] = getPromptPropertySchemas(feature).filter((item) => item.id !== propertyId);
  state.promptStore[feature] = getPromptOptions(feature).map((prompt) => {
    var nextProps = { ...(prompt.customProperties || {}) };
    delete nextProps[propertyId];
    return normalizePromptEntry({ ...prompt, customProperties: nextProps }, prompt, feature);
  });
  savePromptStore();
  renderPromptList();
  els.promptStatus.textContent = `Property ${schema.name} dihapus dari ${getPromptFeatureLabel(feature)}.`;
}

function getPromptSelectedRows(feature) {
  return new Set(Array.isArray(state.promptSelectedRows?.[feature]) ? state.promptSelectedRows[feature] : []);
}

function togglePromptBulkDeleteMode(feature) {
  state.promptBulkDeleteMode[feature] = !state.promptBulkDeleteMode[feature];
  if (!state.promptBulkDeleteMode[feature]) {
    state.promptSelectedRows[feature] = [];
  }
  renderPromptList();
}

function togglePromptSelectedRow(feature, key, checked) {
  var next = getPromptSelectedRows(feature);
  if (checked) next.add(key); else next.delete(key);
  state.promptSelectedRows[feature] = Array.from(next);
}

function deleteSelectedPromptRows(feature) {
  var selected = getPromptSelectedRows(feature);
  if (!selected.size) {
    els.promptStatus.textContent = "Pilih prompt yang ingin dihapus dulu.";
    return;
  }
  state.promptStore[feature] = getPromptOptions(feature).filter((item) => !selected.has(item.key));
  state.promptSelectedRows[feature] = [];
  state.promptBulkDeleteMode[feature] = false;
  savePromptStore();
  syncPromptSelectors();
  renderPromptList();
  els.promptStatus.textContent = `${selected.size} prompt dihapus dari ${getPromptFeatureLabel(feature)}.`;
}

function createPromptRow(feature) {
  var targetFeature = feature || "listing";
  var prompts = getPromptOptions(targetFeature);
  var nextIndex = prompts.length + 1;
  var baseName = `Prompt Baru ${nextIndex}`;
  var keyBase = slugifyPromptKey(baseName);
  var dedup = prompts.some((item) => item.key === keyBase) ? `${keyBase}-${Date.now()}` : keyBase;
  var nextPrompt = normalizePromptEntry({
    feature: targetFeature,
    key: dedup,
    title: baseName,
    content: "",
    tag: "",
    rating: 3,
    generator: promptFeatureMeta[targetFeature]?.defaultGenerator || "GPT",
    placement: promptFeatureMeta[targetFeature]?.defaultPlacement || "",
    background: promptFeatureMeta[targetFeature]?.defaultBackground || "",
    usePrompt: true,
    customProperties: {}
  }, null, targetFeature);
  state.promptStore[targetFeature] = [nextPrompt, ...prompts];
  savePromptStore();
  state.promptExpandedFeatures[targetFeature] = true;
  state.promptHighlightedPair = `${targetFeature}:${nextPrompt.key}`;
  renderPromptList();
  els.promptStatus.textContent = `Baris prompt baru dibuat di ${getPromptFeatureLabel(targetFeature)}.`;
}

async function addPromptManualImages(files) {
  if (!files.length) {
    return;
  }
  var nextItems = await Promise.all(files.slice(0, 24).map(async (file, index) => ({
    id: `manual_${Date.now()}_${index}`,
    name: file.name || `Gambar ${index + 1}`,
    src: await readFileAsDataUrl(file)
  })));
  state.promptManualImages = [...nextItems, ...(state.promptManualImages || [])].slice(0, 48);
  savePromptStore();
  renderPromptMemory();
  els.promptStatus.textContent = `${nextItems.length} gambar ditambahkan ke library gambar.`;
}

function openPromptManualImageDialog() {
  if (els.promptManualImageTitle) els.promptManualImageTitle.value = "";
  if (els.promptManualImageDescription) els.promptManualImageDescription.value = "";
  if (els.promptManualImageUpload) els.promptManualImageUpload.value = "";
  els.promptManualImageDialog?.classList.remove("hidden");
}

function closePromptManualImageDialog() {
  els.promptManualImageDialog?.classList.add("hidden");
}

async function savePromptManualImageFromDialog() {
  var title = String(els.promptManualImageTitle?.value || "").trim();
  var description = String(els.promptManualImageDescription?.value || "").trim();
  var file = els.promptManualImageUpload?.files?.[0];
  if (!title) {
    els.promptStatus.textContent = "Judul gambar wajib diisi.";
    return;
  }
  if (!file) {
    els.promptStatus.textContent = "Upload gambar dulu.";
    return;
  }
  var src = await readFileAsDataUrl(file);
  state.promptManualImages = [{
    id: `manual_${Date.now()}`,
    name: title,
    description,
    src
  }, ...(state.promptManualImages || [])].slice(0, 48);
  savePromptStore();
  renderPromptMemory();
  closePromptManualImageDialog();
  els.promptStatus.textContent = `Gambar ${title} berhasil ditambahkan.`;
}

function deletePromptManualImage(imageId) {
  state.promptManualImages = (state.promptManualImages || []).filter((item) => item.id !== imageId);
  savePromptStore();
  renderPromptMemory();
  els.promptStatus.textContent = "Gambar manual dihapus.";
}

function parseMultiSelectValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function updatePromptInlineValue(feature, key, field, value, propertyId) {
  var prompts = getPromptOptions(feature);
  var index = prompts.findIndex((item) => item.key === key);
  if (index < 0) {
    return;
  }
  var existing = prompts[index];
  var patch = { ...existing };
  if (field === "custom") {
    patch.customProperties = { ...(existing.customProperties || {}), [propertyId]: value };
  } else {
    patch[field] = value;
  }
  if (field === "title" && (!existing.key || existing.key === key)) {
    patch.key = existing.key || slugifyPromptKey(String(value || "prompt-baru"));
  }
  patch.updatedAt = new Date().toISOString();
  prompts[index] = normalizePromptEntry(patch, existing, feature);
  state.promptStore[feature] = [...prompts];
  savePromptStore();
  renderPromptList();
}

async function updatePromptInlineFiles(feature, key, field, files, propertyId) {
  if (!files.length) {
    return;
  }
  var prompts = getPromptOptions(feature);
  var index = prompts.findIndex((item) => item.key === key);
  if (index < 0) {
    return;
  }
  var existing = prompts[index];
  var dataFiles = await Promise.all(files.slice(0, 8).map(async (file) => ({
    name: file.name,
    src: await readFileAsDataUrl(file)
  })));
  var patch = { ...existing };
  if (field === "images") {
    patch.images = dataFiles.map((item) => item.src);
  } else {
    patch.customProperties = {
      ...(existing.customProperties || {}),
      [propertyId]: dataFiles
    };
  }
  patch.updatedAt = new Date().toISOString();
  prompts[index] = normalizePromptEntry(patch, existing, feature);
  state.promptStore[feature] = [...prompts];
  savePromptStore();
  renderPromptList();
}

function buildPromptCopyButton(pair, field, label) {
  return `<button type="button" class="gi-mini-btn" data-prompt-copy="${escapeHtml(pair)}" data-prompt-copy-field="${escapeHtml(field)}" style="padding:5px 8px;font-size:10px">${escapeHtml(label || "Salin")}</button>`;
}

function buildPromptSummaryText(prompt, feature) {
  var customLines = getPromptPropertySchemas(feature).map((schema) => {
    var value = prompt.customProperties?.[schema.id];
    if (Array.isArray(value)) {
      if (schema.type === "file_media") {
        return `${schema.name}: ${value.length} file`;
      }
      return `${schema.name}: ${value.join(", ") || "-"}`;
    }
    return `${schema.name}: ${value == null || value === "" ? "-" : value}`;
  });
  return [
    `Feature: ${getPromptFeatureLabel(feature)}`,
    `Nama: ${prompt.title || "-"}`,
    `Key: ${prompt.key || "-"}`,
    `Tag: ${prompt.tag || "-"}`,
    `Rating: ${Number(prompt.rating || 3)}/5`,
    `Generator: ${prompt.generator || "-"}`,
    `Penempatan: ${prompt.placement || "-"}`,
    `Background: ${prompt.background || "-"}`,
    `Use: ${prompt.usePrompt !== false ? "Yes" : "No"}`,
    `Usage Count: ${Number(prompt.usageCount || 0)}`,
    "",
    "Teks Prompt:",
    prompt.content || "-",
    customLines.length ? "" : null,
    customLines.length ? "Properti Custom:" : null,
    customLines.length ? customLines.join("\n") : null,
    "",
    `Media: ${Array.isArray(prompt.images) ? prompt.images.length : 0} file`
  ].filter((line) => line != null).join("\n");
}

function sortPromptsForTable(prompts, feature) {
  return [...prompts].sort((a, b) => {
    var pairA = `${feature}:${a.key}`;
    var pairB = `${feature}:${b.key}`;
    if (state.promptHighlightedPair && pairA === state.promptHighlightedPair) return -1;
    if (state.promptHighlightedPair && pairB === state.promptHighlightedPair) return 1;
    var priorityDelta = getPromptPriorityMeta(b).score - getPromptPriorityMeta(a).score;
    if (priorityDelta) return priorityDelta;
    var usageDelta = Number(b?.usageCount || 0) - Number(a?.usageCount || 0);
    if (usageDelta) return usageDelta;
    return String(a?.title || "").localeCompare(String(b?.title || ""));
  });
}

function renderPromptInlineTextCell(pair, field, value, placeholder, isTextarea) {
  if (isTextarea) {
    return `<div style="display:grid;gap:5px"><textarea data-prompt-inline="${escapeHtml(pair)}" data-prompt-field="${escapeHtml(field)}" placeholder="${escapeHtml(placeholder || "")}" style="width:100%;min-height:54px;background:#ffffff;border:1px solid #d9d9d9;border-radius:10px;color:#1f1f1f;padding:8px 10px;resize:vertical;line-height:1.5;font-size:14px">${escapeHtml(value || "")}</textarea>${buildPromptCopyButton(pair, field, "Salin")}</div>`;
  }
  return `<input data-prompt-inline="${escapeHtml(pair)}" data-prompt-field="${escapeHtml(field)}" value="${escapeHtml(value || "")}" placeholder="${escapeHtml(placeholder || "")}" style="width:100%;background:#ffffff;border:1px solid #d9d9d9;border-radius:10px;color:#1f1f1f;padding:8px 10px;font-size:14px">`;
}

function renderPromptInlineSelectCell(pair, field, value, options) {
  var optionHtml = [`<option value=""></option>`].concat((options || []).map((option) => `<option value="${escapeHtml(option)}"${option === value ? " selected" : ""}>${escapeHtml(option)}</option>`)).join("");
  return `<select data-prompt-inline="${escapeHtml(pair)}" data-prompt-field="${escapeHtml(field)}" style="width:100%;background:#ffffff;border:1px solid #d9d9d9;border-radius:10px;color:#1f1f1f;padding:9px 10px">${optionHtml}</select>`;
}

function renderPromptInlineMultiSelectCell(pair, propertyId, value, options) {
  var selected = new Set(parseMultiSelectValue(value));
  return `<select multiple size="${Math.min(4, Math.max(2, (options || []).length || 2))}" data-prompt-inline="${escapeHtml(pair)}" data-prompt-field="custom" data-prompt-property="${escapeHtml(propertyId)}" style="width:100%;background:#ffffff;border:1px solid #d9d9d9;border-radius:10px;color:#1f1f1f;padding:8px 10px">${(options || []).map((option) => `<option value="${escapeHtml(option)}"${selected.has(option) ? " selected" : ""}>${escapeHtml(option)}</option>`).join("")}</select>`;
}

function renderPromptInlineCheckboxCell(pair, field, checked, propertyId) {
  return `<label style="display:grid;place-items:center;min-height:42px"><input data-prompt-inline="${escapeHtml(pair)}" data-prompt-field="${escapeHtml(field)}"${propertyId ? ` data-prompt-property="${escapeHtml(propertyId)}"` : ""} type="checkbox"${checked ? " checked" : ""} style="accent-color:#FFA500;width:16px;height:16px"></label>`;
}

function renderPromptInlineFileCell(pair, field, value, propertyId) {
  var count = Array.isArray(value) ? value.length : 0;
  var preview = count ? `<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:8px">${value.slice(0, 2).map((item) => {
    var src = typeof item === "string" ? item : item?.src || "";
    return src ? `<img src="${escapeHtml(src)}" style="width:28px;height:28px;border-radius:8px;object-fit:cover;border:1px solid rgba(255,255,255,.08)">` : "";
  }).join("")}<span class="gi-muted">${count} file</span></div>` : `<div class="gi-muted" style="margin-bottom:8px">No media</div>`;
  return `${preview}<label class="gi-mini-btn" style="display:inline-flex;align-items:center;gap:6px;cursor:pointer">Upload<input class="hidden" type="file" accept="image/*" multiple data-prompt-inline-file="${escapeHtml(pair)}" data-prompt-field="${escapeHtml(field)}"${propertyId ? ` data-prompt-property="${escapeHtml(propertyId)}"` : ""}></label>`;
}

function renderPromptCustomPropertyCell(pair, prompt, schema) {
  var value = prompt.customProperties?.[schema.id];
  if (schema.type === "number") {
    return `<input data-prompt-inline="${escapeHtml(pair)}" data-prompt-field="custom" data-prompt-property="${escapeHtml(schema.id)}" type="number" value="${escapeHtml(value == null ? "" : String(value))}" style="width:100%;background:#ffffff;border:1px solid #d9d9d9;border-radius:10px;color:#1f1f1f;padding:9px 10px">`;
  }
  if (schema.type === "select") {
    return renderPromptInlineSelectCell(pair, "custom", value || "", schema.options).replace('data-prompt-field="custom"', `data-prompt-field="custom" data-prompt-property="${escapeHtml(schema.id)}"`);
  }
  if (schema.type === "multi_select") {
    return renderPromptInlineMultiSelectCell(pair, schema.id, value, schema.options);
  }
  if (schema.type === "checkbox") {
    return renderPromptInlineCheckboxCell(pair, "custom", !!value, schema.id);
  }
  if (schema.type === "url") {
    return renderPromptInlineTextCell(pair, "custom", value || "", "https://...", false).replace('data-prompt-field="custom"', `data-prompt-field="custom" data-prompt-property="${escapeHtml(schema.id)}"`);
  }
  if (schema.type === "file_media") {
    return renderPromptInlineFileCell(pair, "custom", Array.isArray(value) ? value : [], schema.id);
  }
  if (schema.type === "date") {
    return `<input data-prompt-inline="${escapeHtml(pair)}" data-prompt-field="custom" data-prompt-property="${escapeHtml(schema.id)}" type="date" value="${escapeHtml(value || "")}" style="width:100%;background:#ffffff;border:1px solid #d9d9d9;border-radius:10px;color:#1f1f1f;padding:9px 10px">`;
  }
  return renderPromptInlineTextCell(pair, "custom", value || "", schema.name, false).replace('data-prompt-field="custom"', `data-prompt-field="custom" data-prompt-property="${escapeHtml(schema.id)}"`);
}

function renderPromptList() {
  if (!els.promptList || !els.promptCount) {
    return;
  }
  var allPrompts = getPromptFeaturesForDatabase().flatMap((feature) => getPromptOptions(feature));
  els.promptCount.textContent = `${allPrompts.length} prompt`;
  els.promptList.innerHTML = getPromptFeaturesForDatabase().map((feature) => {
    var prompts = sortPromptsForTable(getPromptOptions(feature), feature);
    var meta = promptFeatureMeta[feature] || promptFeatureMeta.listing;
    var customSchemas = getPromptPropertySchemas(feature);
    var isExpanded = !!state.promptExpandedFeatures[feature];
    var isBulkDeleteMode = !!state.promptBulkDeleteMode[feature];
    var selectedRows = getPromptSelectedRows(feature);
    var visiblePrompts = isExpanded ? prompts : prompts.slice(0, 5);
    var columnCount = 10 + customSchemas.length + (isBulkDeleteMode ? 1 : 0);
    var rows = visiblePrompts.length ? visiblePrompts.map((prompt) => {
      var pair = `${feature}:${prompt.key}`;
      var priority = getPromptPriorityMeta(prompt);
      var mediaCell = renderPromptInlineFileCell(pair, "images", prompt.images || []);
      var customCells = customSchemas.map((schema) => `<td style="padding:10px 10px;vertical-align:top;min-width:${schema.type === "multi_select" ? 190 : 150}px;border:1px solid #C9D5E2;background:#FFFFFF">${renderPromptCustomPropertyCell(pair, prompt, schema)}</td>`).join("");
      var isHighlighted = state.promptHighlightedPair === pair;
      return `
        <tr style="border-top:1px solid #C9D5E2;background:${isHighlighted ? "#FFF7E8" : (priority.score > 1 ? "#FBFCFE" : "#FFFFFF")};box-shadow:${isHighlighted ? "inset 0 0 0 1px #E8C98E" : "none"}">
          ${isBulkDeleteMode ? `<td style="padding:10px 10px;vertical-align:top;text-align:center;border:1px solid #C9D5E2;background:inherit"><input type="checkbox" data-prompt-bulk-row="${pair}"${selectedRows.has(prompt.key) ? " checked" : ""} style="accent-color:#C27C2C;width:16px;height:16px"></td>` : ``}
          <td style="padding:10px 10px;vertical-align:top;width:92px;border:1px solid #C9D5E2;background:inherit">${renderPromptTagBadge(priority.label, priority.tone)}</td>
          <td style="padding:10px 10px;vertical-align:top;min-width:220px;border:1px solid #C9D5E2;background:inherit">${renderPromptInlineTextCell(pair, "title", prompt.title || "", "Nama prompt", false)}</td>
          <td style="padding:10px 10px;vertical-align:top;min-width:230px;border:1px solid #C9D5E2;background:inherit">${renderPromptInlineTextCell(pair, "content", prompt.content || "", "Tulis prompt...", true)}</td>
          <td style="padding:10px 10px;vertical-align:top;min-width:140px;border:1px solid #C9D5E2;background:inherit">${renderPromptInlineTextCell(pair, "key", prompt.key || "", "prompt-key", false)}</td>
          <td style="padding:10px 10px;vertical-align:top;min-width:140px;border:1px solid #C9D5E2;background:inherit">${renderPromptInlineTextCell(pair, "tag", prompt.tag || "", "Tag", false)}</td>
          <td style="padding:10px 10px;vertical-align:top;min-width:92px;border:1px solid #C9D5E2;background:inherit"><input data-prompt-inline="${escapeHtml(pair)}" data-prompt-field="rating" type="number" min="1" max="5" step="1" value="${escapeHtml(String(prompt.rating || 3))}" style="width:100%;background:#ffffff;border:1px solid #BCC9D8;border-radius:8px;color:#17202A;padding:9px 10px;font-weight:600"></td>
          <td style="padding:10px 10px;vertical-align:top;min-width:150px;border:1px solid #C9D5E2;background:inherit">${renderPromptInlineSelectCell(pair, "generator", prompt.generator || meta.defaultGenerator, ["GPT", "Grok", "Gemini", "Custom"])}</td>
          <td style="padding:10px 10px;vertical-align:top;min-width:160px;border:1px solid #C9D5E2;background:inherit">${renderPromptInlineTextCell(pair, "placement", prompt.placement || "", "Penempatan", false)}</td>
          <td style="padding:10px 10px;vertical-align:top;min-width:160px;border:1px solid #C9D5E2;background:inherit">${renderPromptInlineTextCell(pair, "background", prompt.background || "", "Background", false)}</td>
          ${customCells}
          <td style="padding:10px 10px;vertical-align:top;min-width:180px;border:1px solid #C9D5E2;background:inherit">${mediaCell}</td>
          <td style="padding:10px 12px;vertical-align:top;text-align:center;border:1px solid #C9D5E2;background:inherit">${renderPromptInlineCheckboxCell(pair, "usePrompt", prompt.usePrompt !== false)}</td>
          <td style="padding:10px 12px;vertical-align:top;border:1px solid #C9D5E2;background:inherit">
            <details style="position:relative">
              <summary class="gi-mini-btn" style="list-style:none;cursor:pointer">Action</summary>
              <div style="position:absolute;right:0;top:calc(100% + 6px);min-width:150px;display:grid;gap:6px;padding:8px;background:#ffffff;border:1px solid #d9d9d9;border-radius:10px;z-index:3">
                <button class="gi-mini-btn" data-prompt-preview="${pair}" type="button">Preview</button>
                <button class="gi-mini-btn" data-prompt-edit="${pair}" type="button">Edit</button>
                <button class="gi-mini-btn" data-prompt-copy="${pair}" data-prompt-copy-field="content" type="button">Salin Prompt</button>
              </div>
            </details>
          </td>
        </tr>
      `;
    }).join("") : `<tr><td colspan="${columnCount}" style="padding:18px 16px;color:#9CA3AF;text-align:center">Belum ada prompt pada feature ini. Gunakan <b>+ Row</b> untuk menambah prompt pertama.</td></tr>`;
    return `
      <section class="gi-panel" style="padding:0;overflow:hidden">
        <div style="padding:16px 18px 10px;border-bottom:1px solid #e5e5e5;background:#fafafa">
          <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
            <div>
              <div style="font-size:16px;font-weight:800;color:#1f1f1f">${escapeHtml(getPromptFeatureLabel(feature))}</div>
              <div class="gi-muted" style="margin-top:4px">${prompts.length} row • generator default ${escapeHtml(meta.defaultGenerator)} • edit langsung di tabel</div>
            </div>
            <div class="gi-tools">
              <button class="gi-mini-btn" type="button" data-prompt-add-row="${feature}">+ Row</button>
              <button class="gi-mini-btn" type="button" data-prompt-add-property="${feature}">+ Property</button>
              <button class="gi-mini-btn" type="button" data-prompt-toggle-bulk-delete="${feature}">${isBulkDeleteMode ? "Batal Hapus" : "Hapus Massal"}</button>
              ${isBulkDeleteMode ? `<button class="gi-mini-btn" type="button" data-prompt-delete-selected="${feature}" style="border-color:#e8caca;color:#b85c5c;background:#fff7f7">Hapus Terpilih (${selectedRows.size})</button>` : ``}
            </div>
          </div>
        </div>
        <div style="overflow:auto;border:1px solid #C9D5E2;border-radius:10px;background:#FFFFFF">
          <table class="gi-prompt-table" style="width:100%;border-collapse:collapse;border-spacing:0;min-width:980px;background:#ffffff;table-layout:fixed">
            <thead>
              <tr style="text-align:left;color:#334155;font-size:12px;text-transform:uppercase;letter-spacing:.03em;background:#EEF3F8">
                ${isBulkDeleteMode ? `<th style="padding:12px 12px;border:1px solid #C9D5E2;font-weight:800;width:70px">Pilih</th>` : ``}
                <th style="padding:12px 12px;border:1px solid #C9D5E2;font-weight:800;width:98px">Prioritas</th>
                <th style="padding:12px 12px;border:1px solid #C9D5E2;font-weight:800;width:230px">Nama</th>
                <th style="padding:12px 12px;border:1px solid #C9D5E2;font-weight:800;width:260px">Teks</th>
                <th style="padding:12px 12px;border:1px solid #C9D5E2;font-weight:800;width:150px">Key</th>
                <th style="padding:12px 12px;border:1px solid #C9D5E2;font-weight:800;width:150px">Tag</th>
                <th style="padding:12px 12px;border:1px solid #C9D5E2;font-weight:800;width:100px">Rating</th>
                <th style="padding:12px 12px;border:1px solid #C9D5E2;font-weight:800;width:170px">${feature === "video" ? "Video Generator" : "Image Generator"}</th>
                <th style="padding:12px 12px;border:1px solid #C9D5E2;font-weight:800;width:170px">Penempatan</th>
                <th style="padding:12px 12px;border:1px solid #C9D5E2;font-weight:800;width:170px">Background</th>
                ${customSchemas.map((schema) => `<th style="padding:12px 12px;border:1px solid #C9D5E2;font-weight:800;width:170px"><div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><span style="display:flex;align-items:center;gap:6px">${escapeHtml(schema.name)}<span class="gi-muted" style="font-size:11px;text-transform:none">${escapeHtml(promptPropertyTypeOptions.find((entry) => entry.value === schema.type)?.label || schema.type)}</span></span><button class="gi-mini-btn" type="button" data-prompt-delete-property="${feature}:${schema.id}" style="padding:4px 7px;font-size:10px">x</button></div></th>`).join("")}
                <th style="padding:12px 12px;border:1px solid #C9D5E2;font-weight:800;width:190px">File & media</th>
                <th style="padding:12px 12px;border:1px solid #C9D5E2;font-weight:800;width:90px">Use?</th>
                <th style="padding:12px 12px;border:1px solid #C9D5E2;font-weight:800;width:120px">Actions</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        ${prompts.length > 5 ? `<div style="padding:10px 14px;border-top:1px solid #e5e5e5;display:flex;justify-content:center;background:#fafafa"><button class="gi-mini-btn" type="button" data-prompt-toggle-feature="${feature}" style="display:inline-flex;align-items:center;gap:8px;padding:8px 14px">${isExpanded ? "Show less" : "Show more"} <span style="font-size:12px">${isExpanded ? "↑" : "↓"}</span></button></div>` : ``}
      </section>
    `;
  }).join("");
  renderPromptMemory();
}

function renderPromptMemory() {
  if (!els.promptMemoryList) {
    return;
  }
  var cards = getPromptFeaturesForDatabase()
    .flatMap((feature) => getPromptOptions(feature).map((prompt) => ({ ...prompt, feature })))
    .filter((prompt) => Array.isArray(prompt.images) && prompt.images.length);
  var manualCards = (state.promptManualImages || []).map((item) => ({
    id: item.id,
    title: item.name || "Gambar",
    feature: "manual",
    image: item.src
  }));
  var promptCards = cards.slice(0, 24).map((prompt) => ({
    id: `${prompt.feature}:${prompt.key}`,
    title: prompt.title,
    feature: getPromptFeatureLabel(prompt.feature),
    image: prompt.images[0],
    description: prompt.content || ""
  }));
  var allCards = [...manualCards, ...promptCards];
  if (!allCards.length) {
    els.promptMemoryList.innerHTML = `<div class="prompt-memory-item"><strong>Belum ada gambar</strong><p>Upload gambar manual di sini atau tambahkan file & media dari tabel prompt.</p></div>`;
    return;
  }
  els.promptMemoryList.innerHTML = allCards.map((item) => `
    <div style="background:#ffffff;border:1px solid #e5e5e5;border-radius:14px;padding:0;overflow:hidden;text-align:left;color:#1f1f1f;display:grid">
      <button type="button" style="padding:0;border:0;background:transparent;cursor:pointer" data-prompt-manual-preview="${item.id}"${item.feature !== "Manual" ? ` data-prompt-edit="${item.id}"` : ""}>
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" style="width:100%;height:170px;object-fit:cover;display:block">
      </button>
      <div style="padding:10px 12px">
        <div style="font-size:13px;font-weight:700;color:#1f1f1f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(item.title)}</div>
        <div class="gi-tools" style="margin-top:8px">
          ${item.feature === "manual"
            ? `<button class="gi-mini-btn" type="button" data-prompt-manual-delete="${item.id}">Hapus</button>`
            : `<button class="gi-mini-btn" type="button" data-prompt-edit="${item.id}">Edit</button>`}
        </div>
      </div>
    </div>
  `).join("");
}

function openPromptEditor() {
  if (!els.promptEditorDialog) {
    return;
  }
  els.promptEditorDialog.classList.remove("hidden");
}

function closePromptEditor() {
  if (!els.promptEditorDialog) {
    return;
  }
  els.promptEditorDialog.classList.add("hidden");
}

function openPromptPreviewDialog() {
  if (els.promptPreviewDialog) {
    els.promptPreviewDialog.classList.remove("hidden");
  }
}

function closePromptPreviewDialog() {
  if (els.promptPreviewDialog) {
    els.promptPreviewDialog.classList.add("hidden");
  }
}

function syncPromptEditorMeta(feature) {
  var meta = promptFeatureMeta[feature] || promptFeatureMeta.listing;
  if (els.promptGenerator && !els.promptGenerator.value.trim()) {
    els.promptGenerator.value = meta.defaultGenerator || "";
  }
  if (els.promptPlacement && !els.promptPlacement.value.trim()) {
    els.promptPlacement.value = meta.defaultPlacement || "";
  }
  if (els.promptBackground && !els.promptBackground.value.trim()) {
    els.promptBackground.value = meta.defaultBackground || "";
  }
}

function loadPromptIntoForm(feature, key) {
  state.activePromptFeature = feature;
  state.activePromptKey = key;
  var prompt = findPromptByKey(feature, key);
  if (!prompt) {
    resetPromptForm(feature);
    return;
  }

  els.promptFeature.value = feature;
  els.promptTitle.value = prompt.title;
  els.promptKey.value = prompt.key;
  els.promptContent.value = prompt.content;
  if (els.promptRating) {
    els.promptRating.value = String(prompt.rating || 3);
  }
  if (els.promptTag) {
    els.promptTag.value = prompt.tag || "";
  }
  if (els.promptGenerator) {
    els.promptGenerator.value = prompt.generator || "";
  }
  if (els.promptPlacement) {
    els.promptPlacement.value = prompt.placement || "";
  }
  if (els.promptBackground) {
    els.promptBackground.value = prompt.background || "";
  }
  if (els.promptUse) {
    els.promptUse.checked = prompt.usePrompt !== false;
  }
  state.promptExistingImages = Array.isArray(prompt.images) ? [...prompt.images] : [];
  state.promptPreviewFiles = [];
  if (els.promptEditorTitleBar) {
    els.promptEditorTitleBar.textContent = `Edit ${getPromptFeatureLabel(feature)}`;
  }
  openPromptEditor();
  renderPromptImageList();
  previewPromptFromForm();
  els.promptStatus.textContent = `Prompt ${prompt.title} siap diedit.`;
}

function resetPromptForm(feature = state.activePromptFeature, shouldOpenDialog) {
  var meta = promptFeatureMeta[feature] || promptFeatureMeta.listing;
  state.activePromptFeature = feature;
  state.activePromptKey = "";
  els.promptFeature.value = feature;
  els.promptTitle.value = "";
  els.promptKey.value = "";
  els.promptContent.value = "";
  if (els.promptRating) {
    els.promptRating.value = "3";
  }
  if (els.promptTag) {
    els.promptTag.value = "";
  }
  if (els.promptGenerator) {
    els.promptGenerator.value = meta.defaultGenerator || "";
  }
  if (els.promptPlacement) {
    els.promptPlacement.value = meta.defaultPlacement || "";
  }
  if (els.promptBackground) {
    els.promptBackground.value = meta.defaultBackground || "";
  }
  if (els.promptUse) {
    els.promptUse.checked = true;
  }
  state.promptExistingImages = [];
  state.promptPreviewFiles = [];
  if (els.promptEditorTitleBar) {
    els.promptEditorTitleBar.textContent = `New ${getPromptFeatureLabel(feature)}`;
  }
  if (shouldOpenDialog) {
    openPromptEditor();
  } else {
    closePromptEditor();
  }
  renderPromptImageList();
  previewPromptFromForm();
  els.promptStatus.textContent = "Buat prompt baru atau pilih prompt yang sudah ada.";
}

function getSelectedPromptContent(feature, key) {
  return findPromptByKey(feature, key)?.content || "";
}

function buildCorePromptBlock() {
  return "";
}

function buildFeatureMemoryBlock(feature) {
  var labelMap = {
    listing: "Listing Image",
    aplus: "A+ Content",
    multi_angle: "Multi-Angle",
    bgremove: "Background Removal"
  };
  var token = (labelMap[feature] || feature || "").toLowerCase().split(" ")[0];
  var memories = state.requestHistory
    .filter((record) => record.status === "success" && String(record.feature || "").toLowerCase().includes(token))
    .slice(0, 3)
    .map((record) => `- ${record.title || record.feature}: ${(record.prompt || "").replace(/\s+/g, " ").slice(0, 180)}`);
  return memories.length ? `Reference memory from previous successful generations:\n${memories.join("\n")}` : "";
}

function incrementPromptUsage(feature, key) {
  if (!feature || !key) {
    return;
  }
  var prompts = getPromptOptions(feature);
  var index = prompts.findIndex((item) => item.key === key);
  if (index < 0) {
    return;
  }
  prompts[index] = normalizePromptEntry({
    ...prompts[index],
    usageCount: (Number(prompts[index].usageCount) || 0) + 1,
    updatedAt: new Date().toISOString()
  });
  state.promptStore[feature] = [...prompts];
  savePromptStore();
}

async function savePromptFromForm() {
  var feature = els.promptFeature.value;
  var meta = promptFeatureMeta[feature] || promptFeatureMeta.listing;
  var title = els.promptTitle.value.trim();
  var key = slugifyPromptKey(els.promptKey.value || title);
  var content = els.promptContent.value.trim();
  var tag = els.promptTag?.value.trim() || "";
  var rating = Math.max(1, Math.min(5, Number(els.promptRating?.value) || 3));
  var generator = els.promptGenerator?.value.trim() || meta.defaultGenerator || "";
  var placement = els.promptPlacement?.value.trim() || meta.defaultPlacement || "";
  var background = els.promptBackground?.value.trim() || meta.defaultBackground || "";
  var usePrompt = !!els.promptUse?.checked;

  if (!title && !key && !content) {
    els.promptStatus.textContent = "Isi judul dan prompt terlebih dahulu.";
    return;
  }

  if (!title || !key || !content) {
    els.promptStatus.textContent = "Untuk preset prompt, title, key, dan content wajib diisi.";
    return;
  }

  var prompts = getPromptOptions(feature);
  var sourceKey = state.activePromptKey || key;
  var existingIndex = prompts.findIndex((item) => item.key === sourceKey || item.key === key);
  var existingPrompt = existingIndex >= 0 ? prompts[existingIndex] : null;
  var uploadedImages = await Promise.all((state.promptPreviewFiles || []).slice(0, 8).map(readFileAsDataUrl));
  var mergedImages = [...state.promptExistingImages, ...uploadedImages].filter(Boolean).slice(0, 8);
  var nextPrompt = normalizePromptEntry({
    key,
    title,
    content,
    tag,
    rating,
    generator,
    placement,
    background,
    usePrompt,
    images: mergedImages.length ? mergedImages : (existingPrompt?.images || []),
    usageCount: existingPrompt?.usageCount || 0,
    updatedAt: new Date().toISOString()
  }, existingPrompt || null, feature);

  if (existingIndex >= 0) {
    prompts[existingIndex] = nextPrompt;
  } else {
    prompts.push(nextPrompt);
  }

  state.promptStore[feature] = [...prompts];
  state.activePromptFeature = feature;
  state.activePromptKey = key;
  state.promptExistingImages = [...nextPrompt.images];
  state.promptPreviewFiles = [];
  savePromptStore();
  syncPromptSelectors();
  renderPromptList();
  renderPromptImageList();
  previewPromptFromForm();
  els.promptKey.value = key;
  els.promptStatus.textContent = "Prompt berhasil disimpan dan terintegrasi ke elemen terkait.";
}

function deletePromptFromForm() {
  var feature = els.promptFeature.value;
  var key = state.activePromptKey || els.promptKey.value.trim();
  if (!key) {
    els.promptStatus.textContent = "Pilih prompt yang ingin dihapus.";
    return;
  }

  state.promptStore[feature] = getPromptOptions(feature).filter((item) => item.key !== key);
  savePromptStore();
  syncPromptSelectors();
  resetPromptForm(feature, false);
  renderPromptList();
  els.promptStatus.textContent = "Prompt berhasil dihapus.";
}

function setPromptUseFlag(feature, key, checked) {
  var prompts = getPromptOptions(feature);
  var index = prompts.findIndex((item) => item.key === key);
  if (index < 0) {
    return;
  }
  prompts[index] = normalizePromptEntry({
    ...prompts[index],
    usePrompt: checked,
    updatedAt: new Date().toISOString()
  }, prompts[index], feature);
  state.promptStore[feature] = [...prompts];
  savePromptStore();
  renderPromptList();
  if (state.activePromptFeature === feature && state.activePromptKey === key && els.promptUse) {
    els.promptUse.checked = checked;
  }
  els.promptStatus.textContent = `Prompt ${prompts[index].title} ${checked ? "diaktifkan" : "dinonaktifkan"}.`;
}

function renderPromptPreviewDialog(payload) {
  if (!els.promptPreviewBody) {
    return;
  }
  var prompt = payload?.prompt || {};
  var feature = payload?.feature || prompt.feature || "listing";
  var summaryText = buildPromptSummaryText(prompt, feature);
  var customSchemas = getPromptPropertySchemas(feature);
  var customPropertyCards = customSchemas.length
    ? `<div class="gi-panel" style="padding:18px"><div style="font-size:14px;font-weight:900;color:#fff;margin-bottom:12px">Properti Custom</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px">${customSchemas.map((schema) => {
      var value = prompt.customProperties?.[schema.id];
      var text = Array.isArray(value)
        ? (schema.type === "file_media" ? `${value.length} file` : value.join(", "))
        : (value == null || value === "" ? "-" : String(value));
      return `<div class="gi-panel" style="padding:12px;background:#111"><div class="gi-muted">${escapeHtml(schema.name)}</div><div style="font-weight:800;color:#fff;margin-top:6px;line-height:1.5;word-break:break-word">${escapeHtml(text || "-")}</div></div>`;
    }).join("")}</div></div>`
    : "";
  if (els.promptPreviewTitle) {
    els.promptPreviewTitle.textContent = payload?.title || `${prompt.title || "Prompt"} Preview`;
  }
  var media = Array.isArray(prompt.images) && prompt.images.length
    ? `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px">${prompt.images.map((src, index) => `<div style="border:1px solid rgba(255,255,255,.08);border-radius:12px;overflow:hidden;background:#111"><img src="${escapeHtml(src)}" alt="${escapeHtml(prompt.title || `Prompt ${index + 1}`)}" style="width:100%;height:180px;object-fit:cover;display:block"><div style="padding:8px 10px;color:#D7E1EA;font-size:11px">Media ${index + 1}</div></div>`).join("")}</div>`
    : `<div class="request-empty" style="min-height:120px">Belum ada file & media untuk prompt ini.</div>`;
  els.promptPreviewBody.innerHTML = `
    <div class="gi-panel" style="padding:18px">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap">
        <div>
          <div style="font-size:24px;font-weight:900;color:#fff">${escapeHtml(prompt.title || "Untitled Prompt")}</div>
          <div class="gi-muted" style="margin-top:6px">${escapeHtml(getPromptFeatureLabel(feature))}</div>
        </div>
        <div class="gi-tools">
          ${buildPromptCopyButton(`${feature}:${prompt.key || ""}`, "content", "Salin Prompt")}
          ${buildPromptCopyButton(`${feature}:${prompt.key || ""}`, "summary", "Salin Ringkasan")}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-top:14px">
        <div class="gi-panel" style="padding:12px;background:#111"><div class="gi-muted">Key</div><div style="font-weight:800;color:#fff;margin-top:6px">${escapeHtml(prompt.key || "-")}</div></div>
        <div class="gi-panel" style="padding:12px;background:#111"><div class="gi-muted">Tag</div><div style="font-weight:800;color:#fff;margin-top:6px">${escapeHtml(prompt.tag || "-")}</div></div>
        <div class="gi-panel" style="padding:12px;background:#111"><div class="gi-muted">Rating</div><div style="font-weight:800;color:#fff;margin-top:6px">${escapeHtml(String(prompt.rating || 3))}/5</div></div>
        <div class="gi-panel" style="padding:12px;background:#111"><div class="gi-muted">Generator</div><div style="font-weight:800;color:#fff;margin-top:6px">${escapeHtml(prompt.generator || "-")}</div></div>
        <div class="gi-panel" style="padding:12px;background:#111"><div class="gi-muted">Penempatan</div><div style="font-weight:800;color:#fff;margin-top:6px">${escapeHtml(prompt.placement || "-")}</div></div>
        <div class="gi-panel" style="padding:12px;background:#111"><div class="gi-muted">Background</div><div style="font-weight:800;color:#fff;margin-top:6px">${escapeHtml(prompt.background || "-")}</div></div>
      </div>
    </div>
    <div class="gi-panel" style="padding:18px">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px;flex-wrap:wrap">
        <div style="font-size:14px;font-weight:900;color:#fff">Teks Prompt</div>
        ${buildPromptCopyButton(`${feature}:${prompt.key || ""}`, "content", "Salin Teks")}
      </div>
      <div style="white-space:pre-wrap;word-break:break-word;background:#111;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:14px;color:#D7E1EA;line-height:1.65">${escapeHtml(prompt.content || "-")}</div>
    </div>
    <div class="gi-panel" style="padding:18px">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px;flex-wrap:wrap">
        <div style="font-size:14px;font-weight:900;color:#fff">Ringkasan Prompt</div>
        ${buildPromptCopyButton(`${feature}:${prompt.key || ""}`, "summary", "Salin Ringkasan")}
      </div>
      <pre class="request-code" style="min-height:180px">${escapeHtml(summaryText)}</pre>
    </div>
    ${customPropertyCards}
    <div class="gi-panel" style="padding:18px">
      <div style="font-size:14px;font-weight:900;color:#fff;margin-bottom:12px">File & Media</div>
      ${media}
    </div>
  `;
  openPromptPreviewDialog();
}

function openStoredPromptPreview(feature, key) {
  var prompt = findPromptByKey(feature, key);
  if (!prompt) {
    els.promptStatus.textContent = "Prompt tidak ditemukan untuk dipreview.";
    return;
  }
  renderPromptPreviewDialog({
    feature,
    prompt,
    title: `${prompt.title} Preview`
  });
}

function updateFolderCounts() {
  if (els.folderListingCount) {
    els.folderListingCount.textContent = `Listing Images: ${state.folders.listing.length}`;
  }
  if (els.folderMultiCount) {
    els.folderMultiCount.textContent = `Multi-Angle: ${state.folders.multi.length}`;
  }
  if (els.folderAplusCount) {
    els.folderAplusCount.textContent = `A+ Content: ${state.folders.aplus.length}`;
  }
}

function addResultsToFolder(type, items) {
  if (!items.length) {
    return;
  }

  var normalized = items.map((item) => ({
    src: item.src?.startsWith("data:") ? "" : item.src,
    title: item.title || item.name || "Generated Asset",
    previewType: item.src?.startsWith("data:") ? "generated" : "reference",
    createdAt: new Date().toISOString()
  }));

  state.folders[type] = [...normalized, ...state.folders[type]].slice(0, 50);
  try {
    saveFolderLibrary();
  } catch {
    state.folders[type] = state.folders[type].slice(0, 12);
    saveFolderLibrary();
  }
  updateFolderCounts();
}

function mergeFiles(existingFiles, incomingFiles, maxFiles) {
  var merged = [...existingFiles];

  incomingFiles.forEach((file) => {
    var exists = merged.some(
      (current) =>
        current.name === file.name &&
        current.size === file.size &&
        current.lastModified === file.lastModified
    );

    if (!exists && merged.length < maxFiles) {
      merged.push(file);
    }
  });

  return merged.slice(0, maxFiles);
}

async function saveGenerationToSupabase(type, payload) {
  var settings = getSettings();
  if (!settings.supabaseUrl || !settings.supabaseAnonKey) {
    return;
  }

  await fetch(`${settings.supabaseUrl.replace(/\/+$/, "")}/rest/v1/generation_jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: settings.supabaseAnonKey,
      Authorization: `Bearer ${settings.supabaseAnonKey}`,
      Prefer: "return=minimal"
    },
    body: JSON.stringify({
      tool_type: type,
      payload
    })
  }).catch(() => {});
}

function previewFileInput(input, imgElement) {
  var file = input.files?.[0];
  if (!file) {
    imgElement.removeAttribute("src");
    imgElement.classList.add("hidden");
    return;
  }

  var url = URL.createObjectURL(file);
  imgElement.src = url;
  imgElement.classList.remove("hidden");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]));
}

function getVideoWorkspaceState() {
  if (typeof window._toolsVideoState === "function") {
    return window._toolsVideoState();
  }
  return null;
}

function getVideoWorkspaceForm() {
  var st = getVideoWorkspaceState() || {};
  var form = st.form || {};
  var settings = typeof getSettings === "function" ? getSettings() : {};
  return {
    model: form.model || settings.videoModel || "grok-imagine-video",
    mode: form.mode || "generate",
    resolution: form.resolution || "480p",
    duration: String(form.duration || 6),
    aspectRatio: form.aspect_ratio || form.aspectRatio || "16:9",
    videoUrl: form.videoUrl || "",
    prompt: form.prompt || ""
  };
}

window.AJWVideoSyncField = function (key, value) {
  var st = getVideoWorkspaceState();
  if (!st) return;
  st.form = Object.assign({}, st.form || {}, { [key]: value });
};

window.AJWRenderVideoWorkspace = function () {
  var host = document.getElementById("AJW-GI-VIDEO-ROOT");
  if (!host) return;
  var st = getVideoWorkspaceState() || { images: [], result: null, status: "", error: "", loading: false };
  var form = getVideoWorkspaceForm();
  var resultUrl = st.result && (st.result.url || st.result.video_url || st.result.videoUrl) ? String(st.result.url || st.result.video_url || st.result.videoUrl) : "";
  var copyUrlValue = resultUrl.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  var imageCards = (Array.isArray(st.images) ? st.images : []).map((img, idx) => `
    <div style="position:relative;border:1px solid rgba(255,255,255,.10);border-radius:12px;overflow:hidden;background:#050505">
      <img src="${escapeHtml(img.data || "")}" style="width:100%;height:118px;object-fit:cover;display:block" alt="${escapeHtml(img.name || `image-${idx + 1}`)}">
      <button class="gi-mini-btn" onclick="_toolsVideoRemoveImage(${idx})" style="position:absolute;right:6px;top:6px;width:auto;background:rgba(0,0,0,.72)" type="button">Hapus</button>
      <div style="padding:6px;font-size:10px;color:var(--tx2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(img.name || `image-${idx + 1}`)}</div>
    </div>
  `).join("");
  host.innerHTML = `
    <div class="gi-workspace" style="grid-template-columns:minmax(320px,.85fr) minmax(420px,1.15fr)">
      <aside class="gi-panel">
        <div class="gi-panel-title">Generate Video</div>
        <p class="gi-muted" style="margin-bottom:12px">Upload satu atau beberapa gambar, pakai model Grok Imagine Video, lalu generate atau extend video langsung dari tab ini.</p>
        <div class="gi-field">
          <label>Upload Image (maks 7)</label>
          <input id="TOOL-VID-IMAGES" type="file" accept="image/*" multiple class="fi" style="padding:8px" onchange="_toolsVideoReadFiles(this)">
          <div class="gi-muted">1 gambar = image-to-video. Lebih dari 1 gambar = reference-to-video.</div>
        </div>
        <div class="gi-grid2">
          <div class="gi-field">
            <label>Model</label>
            <input id="TOOL-VID-MODEL" class="fi" value="${escapeHtml(form.model)}" oninput="AJWVideoSyncField('model', this.value)">
          </div>
          <div class="gi-field">
            <label>Mode</label>
            <select id="TOOL-VID-MODE" class="fi" onchange="AJWVideoSyncField('mode', this.value)">
              <option value="generate"${form.mode === "generate" ? " selected" : ""}>Generate / Image Reference</option>
              <option value="extend"${form.mode === "extend" ? " selected" : ""}>Extend Video</option>
            </select>
          </div>
        </div>
        <div class="gi-grid3">
          <div class="gi-field">
            <label>Resolusi</label>
            <select id="TOOL-VID-RESOLUTION" class="fi" onchange="AJWVideoSyncField('resolution', this.value)">
              <option value="480p"${form.resolution === "480p" ? " selected" : ""}>480p</option>
              <option value="720p"${form.resolution === "720p" ? " selected" : ""}>720p</option>
            </select>
          </div>
          <div class="gi-field">
            <label>Durasi</label>
            <select id="TOOL-VID-DURATION" class="fi" onchange="AJWVideoSyncField('duration', this.value)">
              <option value="6"${String(form.duration) === "6" ? " selected" : ""}>6s</option>
              <option value="10"${String(form.duration) === "10" ? " selected" : ""}>10s</option>
            </select>
          </div>
          <div class="gi-field">
            <label>Aspect Ratio</label>
            <select id="TOOL-VID-ASPECT" class="fi" onchange="AJWVideoSyncField('aspect_ratio', this.value)">
              <option value="16:9"${form.aspectRatio === "16:9" ? " selected" : ""}>16:9</option>
              <option value="9:16"${form.aspectRatio === "9:16" ? " selected" : ""}>9:16</option>
              <option value="1:1"${form.aspectRatio === "1:1" ? " selected" : ""}>1:1</option>
              <option value="4:3"${form.aspectRatio === "4:3" ? " selected" : ""}>4:3</option>
              <option value="3:4"${form.aspectRatio === "3:4" ? " selected" : ""}>3:4</option>
            </select>
          </div>
        </div>
        <div class="gi-field">
          <label>URL Video untuk Extend (.mp4)</label>
          <input id="TOOL-VID-EXTEND-URL" class="fi" placeholder="https://.../video.mp4" value="${escapeHtml(form.videoUrl)}" oninput="AJWVideoSyncField('videoUrl', this.value)">
        </div>
        <div class="gi-field">
          <label>Prompt</label>
          <textarea id="TOOL-VID-PROMPT" class="fi" rows="8" placeholder="Contoh: animasikan produk ini dengan gerakan cinematic, cahaya studio, high detail..." oninput="AJWVideoSyncField('prompt', this.value)">${escapeHtml(form.prompt)}</textarea>
        </div>
        <div class="gi-tools" style="align-items:center">
          <span id="TOOL-VID-STATUS" class="gi-muted" style="flex:1 1 auto">${escapeHtml(st.status || "Siap generate video")}</span>
          <button id="TOOL-VID-GENERATE" class="gi-action" onclick="_toolsVideoGenerate()"${st.loading ? " disabled" : ""} type="button" style="width:auto">${st.loading ? "Memproses..." : "Generate Video"}</button>
        </div>
      </aside>
      <main class="gi-panel gi-output">
        <div class="listing-output-header">
          <div>
            <p class="listing-output-kicker">Preview & Output</p>
            <h3 class="listing-output-title">Grok Imagine Video</h3>
          </div>
          <span class="listing-output-chip">${Array.isArray(st.images) ? st.images.length : 0}/7 image</span>
        </div>
        ${imageCards ? `<div class="gi-upload-list" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr));margin-top:0">${imageCards}</div>` : `<div class="request-empty">Belum ada image. Upload satu atau beberapa gambar untuk jadi referensi video.</div>`}
        ${st.error ? `<div style="background:rgba(255,80,80,.10);border:1px solid rgba(255,120,120,.25);color:#FFB4B4;border-radius:10px;padding:10px;font-size:12px">${escapeHtml(st.error)}</div>` : ""}
        ${resultUrl ? `<video src="${escapeHtml(resultUrl)}" controls style="width:100%;max-height:420px;background:#000;border-radius:12px;border:1px solid rgba(255,255,255,.08)"></video><div class="gi-tools"><a class="gi-mini-btn" href="${escapeHtml(resultUrl)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none">Buka Video</a><button class="gi-mini-btn" onclick="_toolsCopy('${copyUrlValue}','URL Video')" type="button">Copy URL</button></div>` : `<div class="request-empty" style="min-height:240px">Output video akan tampil di sini setelah status menjadi done.</div>`}
        <div class="gi-muted">Catatan xAI: proses video asynchronous, mendukung 480p/720p, referensi gambar maksimal 7, dan mode extend memakai URL video sumber.</div>
      </main>
    </div>
  `;
};

function safeJson(value) {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return JSON.stringify({ error: "Tidak bisa menampilkan JSON" }, null, 2);
  }
}

function createRequestId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatRequestTime(dateValue) {
  var date = new Date(dateValue || Date.now());
  var diff = Math.max(0, Date.now() - date.getTime());
  var minute = Math.floor(diff / 60000);
  if (minute < 1) return "Baru saja";
  if (minute < 60) return `${minute} menit lalu`;
  var hour = Math.floor(minute / 60);
  if (hour < 24) return `${hour} jam lalu`;
  return date.toLocaleString("id-ID");
}

function compactRequestForStorage(record) {
  var clone = { ...record };
  clone.images = (record.images || []).map((image) => {
    if (image.src && image.src.length > 450000) {
      return { ...image, src: "", note: "Image terlalu besar untuk disimpan di browser." };
    }
    return image;
  });
  return clone;
}

function saveRequestHistory() {
  try {
    localStorage.setItem(REQUEST_HISTORY_STORAGE_KEY, JSON.stringify(state.requestHistory.slice(0, 80).map(compactRequestForStorage)));
  } catch {
    try {
      var compact = state.requestHistory.slice(0, 40).map((record) => ({ ...compactRequestForStorage(record), images: (record.images || []).map((image) => ({ ...image, src: image.src?.startsWith("http") ? image.src : "" })) }));
      localStorage.setItem(REQUEST_HISTORY_STORAGE_KEY, JSON.stringify(compact));
    } catch {}
  }
}

function loadRequestHistory() {
  try {
    var raw = localStorage.getItem(REQUEST_HISTORY_STORAGE_KEY);
    state.requestHistory = raw ? JSON.parse(raw) : [];
  } catch {
    state.requestHistory = [];
  }
}

function buildRequestCode(record) {
  var input = record.input || {};
  if (record.provider === "fal") {
    return `import { fal } from "@fal-ai/client";\n\nconst result = await fal.subscribe("${record.model || "openai/gpt-image-2/edit"}", {\n  input: ${safeJson(input)}\n});`;
  }
  if (record.provider === "gemini") {
    return `// Gemini image request\nconst input = ${safeJson(input)};\n// Kirim input ini ke model ${record.model || "gemini image model"}.`;
  }
  return `const response = await fetch("${record.apiBaseUrl || "https://api.openai.com/v1"}/images/edits", {\n  method: "POST",\n  headers: { Authorization: "Bearer YOUR_API_KEY" },\n  body: formData // prompt/model/image sesuai Input di atas\n});\n\nconst result = await response.json();`;
}

function createGenerationRequest(data) {
  var now = new Date().toISOString();
  var record = {
    id: createRequestId(),
    createdAt: now,
    updatedAt: now,
    status: "processing",
    progress: 12,
    durationMs: 0,
    feature: data.feature || "Generate Image",
    provider: data.provider || "local",
    model: data.model || "",
    apiBaseUrl: data.apiBaseUrl || "",
    title: data.title || data.feature || "Request",
    prompt: data.prompt || "",
    input: data.input || {},
    output: data.output || {},
    code: data.code || "",
    images: data.images || [],
    error: ""
  };
  state.requestHistory = [record, ...state.requestHistory].slice(0, 100);
  state.activeRequestId = record.id;
  saveRequestHistory();
  renderRequestHistory();
  renderRequestDetail(record.id);
  return record.id;
}

function updateGenerationRequest(id, patch) {
  var record = state.requestHistory.find((item) => item.id === id);
  if (!record) return;
  Object.assign(record, patch, { updatedAt: new Date().toISOString() });
  if (record.createdAt) {
    record.durationMs = Math.max(0, Date.now() - new Date(record.createdAt).getTime());
  }
  if (!record.code) {
    record.code = buildRequestCode(record);
  }
  saveRequestHistory();
  renderRequestHistory();
  if (state.activeRequestId === id) {
    renderRequestDetail(id);
  }
}

function finishGenerationRequest(id, patch) {
  updateGenerationRequest(id, { progress: patch.status === "error" ? 100 : 100, ...patch });
}

function getFilteredRequests() {
  var search = (els.requestSearch?.value || "").toLowerCase().trim();
  var status = els.requestStatusFilter?.value || "all";
  return state.requestHistory.filter((record) => {
    if (status !== "all" && record.status !== status) return false;
    if (!search) return true;
    return [record.id, record.feature, record.provider, record.model, record.prompt, record.title]
      .join(" ").toLowerCase().includes(search);
  });
}

function renderRequestHistory() {
  if (!els.requestHistoryList) return;
  var requests = getFilteredRequests();
  if (!requests.length) {
    els.requestHistoryList.innerHTML = `<div class="request-empty">Belum ada request yang cocok.</div>`;
    return;
  }
  var showPreview = els.requestShowPreview?.checked !== false;
  els.requestHistoryList.innerHTML = requests.map((record) => {
    var image = (record.images || [])[0];
    var preview = showPreview && image?.src ? `<img src="${escapeHtml(image.src)}" alt="${escapeHtml(record.title)}">` : "Preview hidden";
    var active = record.id === state.activeRequestId ? " active" : "";
    var duration = record.durationMs ? `${(record.durationMs / 1000).toFixed(1)}s` : "n/a";
    return `<button class="request-item${active}" data-request-id="${escapeHtml(record.id)}" type="button"><div><div class="request-meta"><strong>${escapeHtml(formatRequestTime(record.createdAt))}</strong><span>${escapeHtml(duration)}</span><span class="request-status ${escapeHtml(record.status)}">${escapeHtml(record.status)}</span></div><div class="request-title">${escapeHtml(record.feature)} · ${escapeHtml(record.provider)} · ${escapeHtml(record.model || "local")}</div><div class="gi-muted">${escapeHtml(record.id)}</div><div class="request-prompt">${escapeHtml(record.prompt || "No prompt")}</div><div class="request-progress"><span style="width:${Math.max(0, Math.min(100, Number(record.progress) || 0))}%"></span></div></div><div class="request-preview">${preview}</div></button>`;
  }).join("");
}

function renderRequestDetail(id) {
  var record = state.requestHistory.find((item) => item.id === id) || state.requestHistory[0];
  if (!record || !els.requestDetailTitle) return;
  state.activeRequestId = record.id;
  var image = (record.images || [])[0];
  els.requestDetailTitle.textContent = record.feature || "Request";
  els.requestDetailSubtitle.textContent = `${record.id} · ${record.status}`;
  els.requestDetailImage.innerHTML = image?.src ? `<img src="${escapeHtml(image.src)}" alt="${escapeHtml(record.title)}">` : "No image saved";
  els.requestDetailMeta.innerHTML = [
    ["Status", record.status],
    ["Provider", record.provider],
    ["Model", record.model || "-"],
    ["Created", new Date(record.createdAt).toLocaleString("id-ID")],
    ["Duration", record.durationMs ? `${(record.durationMs / 1000).toFixed(2)}s` : "n/a"],
    ["Images", String((record.images || []).length)]
  ].map(([key, value]) => `<span>${escapeHtml(key)}</span><strong>${escapeHtml(value)}</strong>`).join("");
  els.requestInputBlock.textContent = safeJson(record.input || { prompt: record.prompt });
  els.requestOutputBlock.textContent = safeJson(record.output || {});
  els.requestCodeBlock.textContent = record.code || buildRequestCode(record);
  renderRequestHistory();
}

function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text || "");
  }
  var area = document.createElement("textarea");
  area.value = text || "";
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  area.remove();
  return Promise.resolve();
}

function getActiveRequest() {
  return state.requestHistory.find((item) => item.id === state.activeRequestId) || state.requestHistory[0];
}

function bindRequestEvents() {
  safeBind(els.requestSearch, "input", renderRequestHistory);
  safeBind(els.requestStatusFilter, "change", renderRequestHistory);
  safeBind(els.requestShowPreview, "change", renderRequestHistory);
  safeBind(els.requestHistoryList, "click", (event) => {
    var button = event.target instanceof HTMLElement ? event.target.closest("[data-request-id]") : null;
    if (button) renderRequestDetail(button.getAttribute("data-request-id"));
  });
  safeBind(els.requestClearHistoryBtn, "click", () => {
    state.requestHistory = [];
    state.activeRequestId = "";
    saveRequestHistory();
    renderRequestHistory();
    if (els.requestDetailTitle) {
      els.requestDetailTitle.textContent = "Pilih request";
      els.requestDetailSubtitle.textContent = "Detail request akan muncul di sini.";
      els.requestDetailImage.textContent = "No image selected";
      els.requestDetailMeta.innerHTML = "";
      els.requestInputBlock.textContent = "{}";
      els.requestOutputBlock.textContent = "{}";
      els.requestCodeBlock.textContent = "// code akan muncul setelah request dipilih";
    }
  });
  safeBind(els.requestCopyPromptBtn, "click", async () => {
    var record = getActiveRequest();
    if (record) await copyTextToClipboard(record.prompt || "");
  });
  safeBind(els.requestShareBtn, "click", async () => {
    var record = getActiveRequest();
    var url = record?.images?.[0]?.src || "";
    if (!record || !url) return;
    if (navigator.share && url.startsWith("http")) {
      await navigator.share({ title: record.title || "Generated image", text: record.prompt || "", url });
    } else {
      await copyTextToClipboard(url);
    }
  });
  safeBind(els.requestDownloadBtn, "click", () => {
    var record = getActiveRequest();
    var url = record?.images?.[0]?.src || "";
    if (!url) return;
    var link = document.createElement("a");
    link.href = url;
    link.download = `${(record.feature || "request").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${record.id}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  });
}
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    var reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Gagal membaca file logo."));
    reader.readAsDataURL(file);
  });
}

function switchWorkspace(target) {
  state.activeWorkspace = target;
  window.__ajwGiActiveWorkspace = target;

  els.workspaceTabs.forEach((tab) => {
    var isActive = tab.dataset.workspaceTarget === target;
    tab.classList.toggle("active", isActive);

    if (tab.closest("header")) {
      tab.classList.toggle("border-b-2", isActive);
      tab.classList.toggle("border-white", isActive);
      tab.classList.toggle("text-white", isActive);
      tab.classList.toggle("text-neutral-500", !isActive);
    }
  });

  els.workspacePanels.forEach((panel) => {
    panel.classList.toggle("hidden", panel.id !== target);
  });
  if (target === "requests-tab") {
    renderRequestHistory();
    if (state.activeRequestId) {
      renderRequestDetail(state.activeRequestId);
    }
  }
  if (target === "video-generation" && typeof window.AJWRenderVideoWorkspace === "function") {
    window.AJWRenderVideoWorkspace();
  }
  updateAllEstimateBadges();
}

function safeBind(element, eventName, handler) {
  if (!element) {
    return;
  }
  element.addEventListener(eventName, handler);
}

function ceilCostToCent(value) {
  return Math.ceil(Math.max(0, Number(value) || 0) * 100) / 100;
}

function formatUsd(value) {
  return `$${ceilCostToCent(value).toFixed(2)}`;
}

function estimateTextTokens(text) {
  return Math.max(0, Math.ceil(String(text || "").trim().length / 4));
}

function getFalQualityMultiplier(quality) {
  var map = { low: 0.68, medium: 0.84, high: 1 };
  return map[String(quality || "high").toLowerCase()] || 1;
}

function getFalSizeDimensions(size, fallback) {
  var key = size && size !== "auto" ? size : (fallback || "auto");
  var map = {
    auto: { width: 1024, height: 1024, label: "auto" },
    square: { width: 1024, height: 1024, label: "1:1" },
    square_hd: { width: 1536, height: 1536, label: "1:1 HD" },
    portrait_4_3: { width: 1024, height: 1365, label: "4:3 portrait" },
    portrait_16_9: { width: 1024, height: 1820, label: "16:9 portrait" },
    landscape_4_3: { width: 1536, height: 1024, label: "4:3 landscape" },
    landscape_16_9: { width: 1820, height: 1024, label: "16:9 landscape" },
    "1024x1024": { width: 1024, height: 1024, label: "1:1" },
    "1536x1024": { width: 1536, height: 1024, label: "16:9" },
    "1024x1536": { width: 1024, height: 1536, label: "2:3" },
    "1:1 Square": { width: 1024, height: 1024, label: "1:1 square" },
    "4:5 Portrait": { width: 1024, height: 1280, label: "4:5 portrait" },
    "16:9 Landscape": { width: 1536, height: 1024, label: "16:9 landscape" },
    "3:4 Story Layout": { width: 1024, height: 1365, label: "3:4 story" }
  };
  return map[key] || map.auto;
}

function estimateFalImageTokens(size, quality, count) {
  var dims = getFalSizeDimensions(size, getSettings().falImageSize);
  var megapixels = (dims.width * dims.height) / 1000000;
  var baseTokens = Math.ceil(megapixels * 4096 * getFalQualityMultiplier(quality || getSettings().falQuality));
  return Math.max(0, baseTokens * Math.max(1, Number(count) || 1));
}

function truncatePromptPreview(text) {
  var clean = String(text || "").trim();
  if (!clean) return "Belum ada prompt aktif.";
  return clean.length > 320 ? `${clean.slice(0, 320)}...` : clean;
}

function buildListingActivePrompt(index) {
  var basePrompt = getSelectedPromptContent("listing", els.listingTemplate?.value) || listingTemplatePrompts.premium;
  var extraPrompt = els.listingPrompt?.value.trim() || "";
  var sellingPoints = els.listingSellingPoints?.value.trim() || "";
  var language = els.listingLanguage?.value || "English";
  return `Product selling points: ${sellingPoints}\nVariation ${index} of ${Math.min(5, Math.max(1, Number(els.listingQuantity?.value) || 1))}.\nLanguage instruction: ${buildLanguageInstruction(language)}\n${buildCorePromptBlock()}\n${buildFeatureMemoryBlock("listing")}\n${basePrompt}\n${extraPrompt}`.trim();
}

function buildMultiPromptEstimateText() {
  var selected = getSelectedAngleDefinitions();
  if (!selected.length) {
    return "";
  }
  return selected.map(function(item, index) {
    return `[${index + 1}] ${item.name}\n${item.prompt || ""}`.trim();
  }).join("\n\n");
}

function buildAplusEstimatePrompt() {
  var selectedCards = getSelectedModuleCards().slice(0, 7);
  if (!selectedCards.length) {
    return "";
  }
  var label = selectedCards[0].dataset.moduleLabel || "A+ Module";
  var description = selectedCards[0].dataset.moduleDescription || "";
  var platform = els.aplusPlatform?.value || "Amazon";
  var aspectRatio = els.aplusAspectRatio?.value || "1:1 Square";
  var preset = getSelectedPromptContent("aplus", els.aplusPromptPreset?.value || "");
  var sellingPoints = els.aplusSellingPoints?.value.trim() || "";
  var requirements = els.aplusDesignRequirements?.value.trim() || "";
  return [
    `Create a polished A+ content image module for ${platform}.`,
    `Module: ${label}.`,
    description ? `Module direction: ${description}.` : "",
    `Aspect ratio: ${aspectRatio}.`,
    sellingPoints ? `Selling points: ${sellingPoints}` : "",
    preset ? `Prompt preset: ${preset}` : "",
    requirements ? `Design requirements: ${requirements}` : ""
  ].filter(Boolean).join("\n");
}

function buildBgremoveEstimatePrompt() {
  var modelLabel = buildBgremoveModelLabel(els.bgremoveModel?.value || "quick");
  var language = els.bgremoveLanguage?.value || "English";
  var resolution = els.bgremoveResolution?.value || "High";
  var format = els.bgremoveFormat?.value || "PNG transparent";
  var refine = els.bgremoveRefine?.checked ? "enabled" : "disabled";
  var presetPrompt = getSelectedPromptContent("bgremove", els.bgremovePromptPreset?.value || "");
  return `Remove the background from this product image.\nCutout model: ${modelLabel}\nResolution: ${resolution}\nOutput format: ${format}\nRefine foreground: ${refine}\nPrompt preset: ${presetPrompt}\nLanguage instruction: ${buildLanguageInstruction(language)}\n${buildCorePromptBlock()}\n${buildFeatureMemoryBlock("bgremove")}\nReturn a clean isolated product with transparent or plain removed background and preserve product edges accurately.`;
}

function renderEstimateBox(container, payload) {
  if (!container) {
    return;
  }
  if (!payload.isFal) {
    container.innerHTML = `<div class="gi-estimator-head"><div><div class="gi-estimator-sub">Estimasi Fal.ai</div><div class="gi-estimator-title">Aktif saat provider Fal.ai GPT Image 2 dipilih</div></div></div><div class="gi-muted">Pilih provider <b>Fal.ai GPT Image 2</b> pada tab ini untuk melihat estimasi token, prompt aktif, dan biaya otomatis.</div>`;
    return;
  }
  container.innerHTML = `<div class="gi-estimator-head"><div><div class="gi-estimator-sub">Estimasi Fal.ai GPT Image 2</div><div class="gi-estimator-title">${payload.title}</div></div><div class="chip">${payload.sizeLabel} • ${payload.quality}</div></div><div class="gi-estimator-grid"><div class="gi-estimator-badge"><div class="k">Prompt</div><div class="v">${payload.promptTokens.toLocaleString("id-ID")} tok</div></div><div class="gi-estimator-badge"><div class="k">Image In</div><div class="v">${payload.imageInputTokens.toLocaleString("id-ID")} tok</div></div><div class="gi-estimator-badge"><div class="k">Image Out</div><div class="v">${payload.imageOutputTokens.toLocaleString("id-ID")} tok</div></div><div class="gi-estimator-badge"><div class="k">Biaya</div><div class="v">${payload.totalCostLabel}</div></div></div><div class="gi-muted" style="margin-top:10px">Prompt dipakai: ${payload.promptCountLabel} • ${payload.imageCountLabel} • biaya dibulatkan naik ke cent terdekat.</div><div class="gi-estimator-prompt">${escapeHtml(truncatePromptPreview(payload.promptPreview))}</div>`;
}

function updateFeatureProgress(feature, patch) {
  var current = state.generationProgress[feature] || { active: false, percent: 0, title: "", detail: "" };
  state.generationProgress[feature] = { ...current, ...patch };
  var prefix = feature === "aplus" ? "aplus" : (feature === "bgremove" ? "bgremove" : feature);
  var box = els[`${prefix}ProgressBox`];
  var title = els[`${prefix}ProgressTitle`];
  var percent = els[`${prefix}ProgressPercent`];
  var bar = els[`${prefix}ProgressBar`];
  var detail = els[`${prefix}ProgressDetail`];
  if (!box || !title || !percent || !bar || !detail) {
    return;
  }
  var next = state.generationProgress[feature];
  box.classList.toggle("hidden", !next.active);
  title.textContent = next.title || "Memproses";
  percent.textContent = `${Math.max(0, Math.min(100, Math.round(Number(next.percent) || 0)))}%`;
  bar.style.width = `${Math.max(0, Math.min(100, Number(next.percent) || 0))}%`;
  detail.textContent = next.detail || "";
}

function resetFeatureProgress(feature) {
  var defaults = {
    listing: { title: "Menunggu generate", detail: "Progress output listing akan muncul di sini." },
    aplus: { title: "Menunggu generate", detail: "Progress output A+ akan muncul di sini." },
    multi: { title: "Menunggu generate", detail: "Progress output multi-angle akan muncul di sini." },
    bgremove: { title: "Menunggu proses", detail: "Progress background removal akan muncul di sini." }
  };
  updateFeatureProgress(feature, { active: false, percent: 0, ...defaults[feature] });
}

function updateAllEstimateBadges() {
  var falQuality = getSettings().falQuality || "high";
  renderEstimateBox(els.listingEstimateBox, (function() {
    var isFal = (els.listingProvider?.value || "") === "fal";
    var quantity = Math.min(5, Math.max(1, Number(els.listingQuantity?.value) || 1));
    var size = els.listingSize?.value || "auto";
    var prompt = buildListingActivePrompt(1);
    var promptTokens = estimateTextTokens(prompt);
    var imageInputTokens = estimateFalImageTokens(size, falQuality, state.listingProductFiles.length || 1);
    var imageOutputTokens = estimateFalImageTokens(size, falQuality, quantity);
    var totalCost = ceilCostToCent((promptTokens / 1000000) * 5 + (imageInputTokens / 1000000) * 8 + (imageOutputTokens / 1000000) * 30);
    return { isFal, title: "Listing Images", sizeLabel: getFalSizeDimensions(size, getSettings().falImageSize).label, quality: falQuality, promptTokens, imageInputTokens, imageOutputTokens, totalCostLabel: formatUsd(totalCost), promptPreview: prompt, promptCountLabel: `${quantity} output`, imageCountLabel: `${state.listingProductFiles.length || 0} gambar input` };
  })());
  renderEstimateBox(els.multiEstimateBox, (function() {
    var isFal = (els.multiProvider?.value || "") === "fal";
    var selected = getSelectedAngleDefinitions();
    var size = els.multiAspectRatio?.value || "auto";
    var prompt = buildMultiPromptEstimateText();
    var promptTokens = estimateTextTokens(prompt);
    var imageInputTokens = estimateFalImageTokens(size, falQuality, state.multiProductFiles.length || 1);
    var imageOutputTokens = estimateFalImageTokens(size, falQuality, selected.length || 1);
    var totalCost = ceilCostToCent((promptTokens / 1000000) * 5 + (imageInputTokens / 1000000) * 8 + (imageOutputTokens / 1000000) * 30);
    return { isFal, title: "Multi-Angle", sizeLabel: getFalSizeDimensions(size, getSettings().falImageSize).label, quality: falQuality, promptTokens, imageInputTokens, imageOutputTokens, totalCostLabel: formatUsd(totalCost), promptPreview: prompt, promptCountLabel: `${selected.length || 0} prompt`, imageCountLabel: `${state.multiProductFiles.length || 0} gambar input` };
  })());
  renderEstimateBox(els.aplusEstimateBox, (function() {
    var isFal = (els.aplusProvider?.value || "") === "fal";
    var outputs = Math.max(1, getSelectedModuleCards().slice(0, 7).length);
    var size = els.aplusAspectRatio?.value || "1:1 Square";
    var prompt = buildAplusEstimatePrompt();
    var promptTokens = estimateTextTokens(prompt);
    var imageInputTokens = estimateFalImageTokens(size, falQuality, state.aplusProductFiles.length || 1);
    var imageOutputTokens = estimateFalImageTokens(size, falQuality, outputs);
    var totalCost = ceilCostToCent((promptTokens / 1000000) * 5 + (imageInputTokens / 1000000) * 8 + (imageOutputTokens / 1000000) * 30);
    return { isFal, title: "A+ Content", sizeLabel: getFalSizeDimensions(size, getSettings().falImageSize).label, quality: falQuality, promptTokens, imageInputTokens, imageOutputTokens, totalCostLabel: formatUsd(totalCost), promptPreview: prompt, promptCountLabel: `${outputs} module output`, imageCountLabel: `${state.aplusProductFiles.length || 0} gambar input` };
  })());
  renderEstimateBox(els.bgremoveEstimateBox, (function() {
    var isFal = (els.bgremoveProvider?.value || "") === "fal";
    var outputs = Math.max(1, state.bgremoveFiles.length || 1);
    var size = getSettings().falImageSize || "auto";
    var prompt = buildBgremoveEstimatePrompt();
    var promptTokens = estimateTextTokens(prompt);
    var imageInputTokens = estimateFalImageTokens(size, falQuality, outputs);
    var imageOutputTokens = estimateFalImageTokens(size, falQuality, outputs);
    var totalCost = ceilCostToCent((promptTokens / 1000000) * 5 + (imageInputTokens / 1000000) * 8 + (imageOutputTokens / 1000000) * 30);
    return { isFal, title: "Background Removal", sizeLabel: getFalSizeDimensions(size, getSettings().falImageSize).label, quality: falQuality, promptTokens, imageInputTokens, imageOutputTokens, totalCostLabel: formatUsd(totalCost), promptPreview: prompt, promptCountLabel: `${outputs} output`, imageCountLabel: `${state.bgremoveFiles.length || 0} gambar input` };
  })());
}

function renderThumbnailList(container, files) {
  if (!files.length) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = files
    .map((file, index) => {
      var url = URL.createObjectURL(file);
      return `
        <div class="relative aspect-square overflow-hidden rounded-lg border border-[#2a2a2a] bg-[#1b1b1b]">
          <img class="h-full w-full object-cover" src="${url}" alt="Upload ${index + 1}">
          <div class="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">${index + 1}</div>
        </div>
      `;
    })
    .join("");
}

function renderListingUploadList() {
  renderThumbnailList(els.listingUploadList, state.listingProductFiles);
  els.listingProductCount.textContent = `${state.listingProductFiles.length}/8`;
  updateAllEstimateBadges();
}

function renderMultiUploadList() {
  renderThumbnailList(els.multiUploadList, state.multiProductFiles);
  els.multiProductCount.textContent = `${state.multiProductFiles.length}/8`;
  updateAllEstimateBadges();
}

function renderBgremoveUploadList() {
  if (!els.bgremoveUploadList || !els.bgremoveCount) {
    return;
  }
  renderThumbnailList(els.bgremoveUploadList, state.bgremoveFiles);
  els.bgremoveCount.textContent = `${state.bgremoveFiles.length}/8`;
  updateAllEstimateBadges();
}

function renderPromptImageList() {
  if (!els.promptImageList || !els.promptImageCount) {
    return;
  }
  var existingImages = Array.isArray(state.promptExistingImages) ? state.promptExistingImages : [];
  var uploadedImages = Array.isArray(state.promptPreviewFiles) ? state.promptPreviewFiles : [];
  var cards = [];

  existingImages.forEach((src, index) => {
    cards.push(`
      <div style="position:relative;border:1px solid rgba(255,255,255,.08);border-radius:12px;overflow:hidden;background:#111">
        <img src="${escapeHtml(src)}" alt="Prompt saved ${index + 1}" style="width:100%;height:108px;object-fit:cover;display:block">
        <div style="padding:8px 10px;font-size:11px;color:#D7E1EA;display:flex;justify-content:space-between;gap:8px;align-items:center">
          <span>Saved image ${index + 1}</span>
          <button type="button" class="gi-mini-btn" data-prompt-remove-existing="${index}">Hapus</button>
        </div>
      </div>
    `);
  });

  uploadedImages.forEach((file, index) => {
    var preview = "";
    try {
      preview = URL.createObjectURL(file);
    } catch {
      preview = "";
    }
    cards.push(`
      <div style="position:relative;border:1px solid rgba(255,255,255,.08);border-radius:12px;overflow:hidden;background:#111">
        ${preview ? `<img src="${escapeHtml(preview)}" alt="${escapeHtml(file.name)}" style="width:100%;height:108px;object-fit:cover;display:block">` : `<div style="height:108px;display:grid;place-items:center;color:#9CA3AF;font-size:12px">No preview</div>`}
        <div style="padding:8px 10px;font-size:11px;color:#D7E1EA;display:flex;justify-content:space-between;gap:8px;align-items:center">
          <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(file.name)}</span>
          <button type="button" class="gi-mini-btn" data-prompt-remove-upload="${index}">Hapus</button>
        </div>
      </div>
    `);
  });

  els.promptImageList.innerHTML = cards.length
    ? cards.join("")
    : `<div class="gi-empty" style="min-height:100px">Belum ada gambar prompt. Tambahkan gambar background, referensi, atau thumbnail di sini.</div>`;
  els.promptImageCount.textContent = `${Math.min(8, existingImages.length + uploadedImages.length)}/8`;
}

function previewPromptFromForm() {
  if (!els.promptPreviewOutput) {
    return;
  }
  var title = els.promptTitle?.value.trim() || "Untitled prompt";
  var key = slugifyPromptKey(els.promptKey?.value || title) || "-";
  var feature = els.promptFeature?.value || "listing";
  var meta = promptFeatureMeta[feature] || promptFeatureMeta.listing;
  var tag = els.promptTag?.value.trim() || "-";
  var rating = Math.max(1, Math.min(5, Number(els.promptRating?.value) || 3));
  var generator = els.promptGenerator?.value.trim() || meta.defaultGenerator || "-";
  var placement = els.promptPlacement?.value.trim() || meta.defaultPlacement || "-";
  var background = els.promptBackground?.value.trim() || meta.defaultBackground || "-";
  var usePrompt = els.promptUse?.checked ? "Yes" : "No";
  var content = els.promptContent?.value.trim() || getSelectedPromptContent(feature, key) || "";
  var savedImageNames = (state.promptExistingImages || []).map((src, index) => `${index + 1}. Saved image ${index + 1}`).join("\n");
  var uploadedImageNames = state.promptPreviewFiles.map((file, index) => `${index + 1}. ${file.name}`).join("\n");
  els.promptPreviewOutput.textContent = [
    `Feature: ${getPromptFeatureLabel(feature)}`,
    `Key: ${key}`,
    `Title: ${title}`,
    `Tag: ${tag}`,
    `Rating: ${rating}/5`,
    `Generator: ${generator}`,
    `Placement: ${placement}`,
    `Background: ${background || "-"}`,
    `Use in generator: ${usePrompt}`,
    "",
    content || "Prompt masih kosong.",
    "",
    savedImageNames ? `Saved image references:\n${savedImageNames}` : "Saved image references: belum ada",
    "",
    uploadedImageNames ? `Queued upload images:\n${uploadedImageNames}` : "Queued upload images: belum ada",
    "",
    "Catatan: gambar yang tersimpan ikut menjadi media prompt. Gambar upload baru akan disimpan saat tombol Simpan Prompt ditekan."
  ].join("\n");
  if (els.promptStatus) {
    els.promptStatus.textContent = "Preview prompt database sudah diperbarui.";
  }
}

function openFormPromptPreview() {
  var feature = els.promptFeature?.value || "listing";
  var meta = promptFeatureMeta[feature] || promptFeatureMeta.listing;
  renderPromptPreviewDialog({
    feature,
    prompt: {
      key: slugifyPromptKey(els.promptKey?.value || els.promptTitle?.value || "") || "-",
      title: els.promptTitle?.value.trim() || "Untitled prompt",
      tag: els.promptTag?.value.trim() || "",
      rating: Math.max(1, Math.min(5, Number(els.promptRating?.value) || 3)),
      generator: els.promptGenerator?.value.trim() || meta.defaultGenerator || "",
      placement: els.promptPlacement?.value.trim() || meta.defaultPlacement || "",
      background: els.promptBackground?.value.trim() || meta.defaultBackground || "",
      usePrompt: !!els.promptUse?.checked,
      usageCount: 0,
      content: els.promptContent?.value.trim() || "",
      images: [...(state.promptExistingImages || [])]
    },
    title: "Preview Draft Prompt"
  });
}

function renderListingResults() {
  if (!state.listingResults.length) {
    els.listingPreviewGrid.innerHTML = `<div class="listing-empty">Belum ada listing image yang dihasilkan.</div>`;
    els.listingPreviewGrid.classList.remove("preview-fit", "preview-fill", "auto-layout-compact");
    return;
  }

  els.listingPreviewGrid.classList.toggle("preview-fit", state.listingPreviewMode === "fit");
  els.listingPreviewGrid.classList.toggle("preview-fill", state.listingPreviewMode !== "fit");
  els.listingPreviewGrid.classList.toggle("auto-layout-compact", state.listingAutoLayout);

  els.listingPreviewGrid.innerHTML = state.listingResults
    .map((item, index) => {
      return `
      <article class="gi-result-card listing-card ${index === 0 ? "main" : ""}">
        <div class="gi-result-frame">
          <img src="${item.src}" alt="Listing image ${index + 1}">
        </div>
      </article>
    `;
    })
    .join("");
}

function updateListingCanvasControls() {
  if (els.listingPreviewModeBtn) {
    els.listingPreviewModeBtn.textContent = state.listingPreviewMode === "fit" ? "Preview Fit" : "Preview Fill";
    els.listingPreviewModeBtn.classList.add("active");
  }

  if (els.listingAutoLayoutBtn) {
    els.listingAutoLayoutBtn.classList.toggle("active", state.listingAutoLayout);
    els.listingAutoLayoutBtn.textContent = state.listingAutoLayout ? "Auto Layout On" : "Auto Layout Off";
  }
}

function updateMultiAngleCount() {
  var selected = getSelectedMultiPrompts().length;
  var label = `${selected} prompt selected`;
  if (els.multiAngleCountLabel) {
    els.multiAngleCountLabel.textContent = label;
  }
  if (els.multiHeroSubtitle) {
    els.multiHeroSubtitle.innerHTML = `AI generates <strong class="text-white">${selected || 0} output image${selected === 1 ? "" : "s"}</strong> from selected prompts only`;
  }
  if (els.generateMultiBtn) {
    els.generateMultiBtn.textContent = selected ? `Generate ${selected} Images` : "Generate Multi-Angle";
  }
}

function updateAplusCounts() {
  els.aplusProductCount.textContent = `${state.aplusProductFiles.length}/5`;
  els.aplusReferenceCount.textContent = `${state.aplusReferenceFiles.length}/5`;
  els.aplusModuleCount.textContent = `${state.selectedModules.size}/16 selected`;
  var canGenerate = state.aplusProductFiles.length > 0;
  els.aplusGenerateHint.textContent = canGenerate
    ? "Ready to generate professional A+ content images"
    : "Please upload at least one product image first";
  updateAllEstimateBadges();
}

function setStyleMode(mode) {
  state.activeStyleMode = mode;
  var trending = mode === "trending";
  els.styleModeTrending.classList.toggle("active", trending);
  els.styleModeReference.classList.toggle("active", !trending);
  els.styleModeTrending.classList.toggle("text-neutral-400", !trending);
  els.styleModeReference.classList.toggle("text-neutral-400", trending);
  els.trendingStylePanel.classList.toggle("hidden", !trending);
  els.referenceStylePanel.classList.toggle("hidden", trending);
}

function updatePreviewFromUploads() {
  var [hero, second, third] = state.aplusProductFiles;
  if (hero) {
    els.aplusHeroImage.src = URL.createObjectURL(hero);
  }
  if (second) {
    els.aplusCard2Image.src = URL.createObjectURL(second);
  }
  if (third) {
    els.aplusCard3Image.src = URL.createObjectURL(third);
  }
}

function getSelectedModuleCards() {
  return Array.from(els.moduleCards).filter((card) => state.selectedModules.has(card.dataset.moduleKey || ""));
}

function buildAplusModuleSummary() {
  var selectedCards = getSelectedModuleCards();
  if (!selectedCards.length) {
    return "No module selected";
  }

  return selectedCards
    .map((card) => {
      var label = card.dataset.moduleLabel || card.querySelector("strong")?.textContent?.trim() || "Module";
      var description = card.dataset.moduleDescription || card.querySelector("span:last-child")?.textContent?.trim() || "";
      return `${label}: ${description}`;
    })
    .join("\n");
}

function renderAplusGridFromModules() {
  var selectedCards = getSelectedModuleCards().slice(0, 7);
  var uploadedUrls = state.aplusProductFiles.map((file) => URL.createObjectURL(file));
  var language = els.aplusLanguage?.value || "English";
  var fallbackImages = [
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80"
  ];

  var cardsMarkup = selectedCards.map((card, index) => {
    var label = card.dataset.moduleLabel || card.querySelector("strong")?.textContent?.trim() || `Module ${index + 1}`;
    var description = card.dataset.moduleDescription || card.querySelector("span:last-child")?.textContent?.trim() || "";
    var localizedDescription = getLanguageLabel(language, {
      Indonesia: description,
      English: description,
      Chinese: description
    });
    var isImageCard = index < 3;
    var imageSrc = uploadedUrls[index % Math.max(uploadedUrls.length, 1)] || fallbackImages[index] || fallbackImages[0];
    var cardClass = index === 0 ? "aplus-card aplus-hero" : "aplus-card";

    if (isImageCard) {
      return `
        <article class="${cardClass}">
          <img src="${imageSrc}" alt="${label}">
        </article>
      `;
    }

    return `
      <article class="aplus-card light-card">
        <div class="aplus-card-label dark-text">${String(index + 1).padStart(2, "0")}</div>
        <div class="aplus-placeholder-content">
          <h3>${label}</h3>
          <p>${localizedDescription}</p>
        </div>
      </article>
    `;
  });

  els.aplusPreviewGrid.innerHTML = cardsMarkup.join("");
}

function generateAplusPreview() {
  renderAplusGridFromModules();
  var language = els.aplusLanguage?.value || "English";
  els.aplusGenerateHint.textContent = state.aplusProductFiles.length
    ? getLanguageLabel(language, {
      Indonesia: "Preview A+ content diperbarui dari gambar produk dan modul prompt yang dipilih",
      English: "A+ content preview refreshed from uploaded product images and selected prompt modules",
      Chinese: "A+ 内容预览已根据上传的产品图片和所选提示模块更新"
    })
    : getLanguageLabel(language, {
      Indonesia: "Silakan upload minimal satu gambar produk terlebih dahulu",
      English: "Please upload at least one product image first",
      Chinese: "请先上传至少一张产品图片"
    });
}

function renderAplusGeneratedResults(results) {
  if (!results.length) {
    renderAplusGridFromModules();
    return;
  }
  els.aplusPreviewGrid.innerHTML = results.map((item, index) => `
    <article class="aplus-card ${index === 0 ? "aplus-hero" : ""}">
      <img src="${item.src}" alt="${item.title}">
    </article>
  `).join("");
}

async function generateAplusImagesWithProvider() {
  if (!state.aplusProductFiles.length) {
    els.aplusGenerateHint.textContent = "Please upload at least one product image first";
    return false;
  }
  updateFeatureProgress("aplus", { active: true, percent: 8, title: "Menyiapkan generate A+", detail: "Memeriksa gambar produk, modul, dan provider aktif." });
  var selectedCards = getSelectedModuleCards().slice(0, 7);
  if (!selectedCards.length) {
    els.aplusGenerateHint.textContent = "Pilih minimal satu module A+.";
    return false;
  }
  var platform = els.aplusPlatform.value;
  var aspectRatio = els.aplusAspectRatio.value;
  var preset = getSelectedPromptContent("aplus", els.aplusPromptPreset.value);
  var sellingPoints = els.aplusSellingPoints.value.trim();
  var requirements = els.aplusDesignRequirements.value.trim();
  var serializedFiles = await serializeFilesForBackend(state.aplusProductFiles.concat(state.aplusReferenceFiles || []), 5);
  var results = [];
  for (var index = 0; index < selectedCards.length; index += 1) {
    var card = selectedCards[index];
    var label = card.dataset.moduleLabel || card.querySelector("strong")?.textContent?.trim() || `A+ Module ${index + 1}`;
    var description = card.dataset.moduleDescription || "";
    els.aplusGenerateHint.textContent = `Generating A+ ${label} (${index + 1}/${selectedCards.length})...`;
    updateFeatureProgress("aplus", { active: true, percent: Math.round(20 + ((index / selectedCards.length) * 70)), title: `Generating ${label}`, detail: `Memproses modul ${index + 1} dari ${selectedCards.length}.` });
    var prompt = [
      `Create a polished A+ content image module for ${platform}.`,
      `Module: ${label}.`,
      description ? `Module direction: ${description}.` : "",
      `Aspect ratio: ${aspectRatio}.`,
      sellingPoints ? `Selling points: ${sellingPoints}` : "",
      buildFeatureMemoryBlock("aplus"),
      preset ? `Prompt preset: ${preset}` : "",
      requirements ? `Design requirements: ${requirements}` : ""
    ].filter(Boolean).join("\n");
    var requestId = createGenerationRequest({
      feature: "A+ Content",
      provider: "backend-router",
      model: "backend-managed",
      apiBaseUrl: getBackendApiBaseUrl(),
      title: label,
      prompt,
      input: {
        prompt,
        feature: "aplus_content",
        module: label,
        platform,
        aspect_ratio: aspectRatio,
        image_files: state.aplusProductFiles.map((file) => file.name),
        num_images: 1
      }
    });
    try {
      updateGenerationRequest(requestId, { progress: 45 });
      var generated = await backendGenerateImage("aplus", {
        platform,
        language: els.aplusLanguage.value,
        aspectRatio,
        sellingPoints,
        designRequirements: requirements ? `${requirements}\n${description}` : description,
        basePrompt: preset,
        moduleLabel: label,
        brandInfo: state.brandInfo,
        images: serializedFiles
      });
      var src = generated.images[0].src;
      updateGenerationRequest(requestId, {
        progress: 72,
        prompt: generated.prompt || prompt,
        provider: generated.task?.provider || "backend-router",
        model: generated.task?.model || "backend-managed"
      });
      finishGenerationRequest(requestId, {
        status: "success",
        images: [{ src, title: label }],
        output: { images: [{ url: src, title: label }] }
      });
      results.push({ src, title: label });
    } catch (error) {
      finishGenerationRequest(requestId, { status: "error", error: error.message, output: { error: error.message } });
      throw error;
    }
    renderAplusGeneratedResults(results);
  }
  addResultsToFolder("aplus", results);
  els.aplusGenerateHint.textContent = `${results.length} A+ image berhasil digenerate.`;
  incrementPromptUsage("aplus", els.aplusPromptPreset.value);
  updateFeatureProgress("aplus", { active: true, percent: 100, title: "Generate A+ selesai", detail: `${results.length} output berhasil dibuat.` });
  return true;
}

function getSelectedAngleDefinitions() {
  var language = els.multiLanguage?.value || "English";
  var enhancedMap = els.multiWebLikeMode?.checked
    ? { ...state.multiEnhancedPrompts, ...parseEnhancedMultiPromptText(els.multiEnhancedPromptOutput?.value || "") }
    : {};
  return getSelectedMultiPrompts().map((prompt) => ({
    key: prompt.sourceKey || prompt.key,
    name: localizeMultiAngleName(prompt.title || "Prompt", language),
    prompt: `${enhancedMap[prompt.key] || prompt.content || ""}\n${buildFeatureMemoryBlock("multi_angle")}`.trim(),
    promptTitle: prompt.title || "Prompt"
  }));
}

function renderMultiAngleResults() {
  if (!state.multiResults.length) {
    els.multiPreviewGrid.innerHTML = `<div class="multi-empty">Belum ada hasil multi-angle yang dihasilkan.</div>`;
    return;
  }

  els.multiPreviewGrid.innerHTML = state.multiResults
    .map((item, index) => `
      <article class="gi-result-card multi-card ${index === 0 ? "multi-card-hero" : ""}">
        <div class="gi-result-frame">
          <img src="${item.src}" alt="${item.name}">
        </div>
      </article>
    `)
    .join("");
}

function renderBgremoveResults() {
  if (!state.bgremoveResults.length) {
    els.bgremovePreviewGrid.innerHTML = `<div class="bgremove-empty">Belum ada hasil background removal.</div>`;
    return;
  }

  var language = els.bgremoveLanguage?.value || "English";
  var originalLabel = getLanguageLabel(language, {
    Indonesia: "Asli",
    English: "Original",
    Chinese: "原图"
  });
  var removedLabel = getLanguageLabel(language, {
    Indonesia: "Background Dihapus",
    English: "Background Removed",
    Chinese: "已去背景"
  });
  var downloadLabel = getLanguageLabel(language, {
    Indonesia: "Unduh",
    English: "Download",
    Chinese: "下载"
  });

  els.bgremovePreviewGrid.innerHTML = state.bgremoveResults
    .map((item, index) => `
      <article class="bgremove-card">
        <div class="bgremove-pair">
          <div class="bgremove-pane">
            <span class="bgremove-badge">${originalLabel}</span>
            <img src="${item.beforeSrc}" alt="Original ${index + 1}">
          </div>
          <div class="bgremove-pane checkerboard">
            <span class="bgremove-badge">${removedLabel}</span>
            <img src="${item.afterSrc}" alt="Removed ${index + 1}">
          </div>
        </div>
        <div class="bgremove-card-footer">
          <div>
            <strong>${item.title}</strong>
            <span>${item.modelLabel}</span>
          </div>
          <button class="multi-card-download" data-bgremove-download-index="${index}" type="button">
            <span class="material-symbols-outlined text-[16px]">download</span>
            <span>${downloadLabel}</span>
          </button>
        </div>
      </article>
    `)
    .join("");
}

function buildMultiAngleDegrees(angleKey) {
  var degrees = {
    front: "0°",
    "front-side": "45°",
    side: "90°",
    "back-side": "135°",
    back: "180°",
    "top-down": "0° / 55°",
    "bottom-up": "0° / -40°",
    "front-elevated": "45° / 35°",
    "front-closeup": "0° / 10° / 1.6x"
  };
  return degrees[angleKey] || "";
}

function localizeMultiAngleName(angleName, language) {
  var translations = {
    Front: { Indonesia: "Depan", English: "Front", Chinese: "正面" },
    "Front Side": { Indonesia: "Depan Samping", English: "Front Side", Chinese: "前侧" },
    Side: { Indonesia: "Samping", English: "Side", Chinese: "侧面" },
    "Back Side": { Indonesia: "Belakang Samping", English: "Back Side", Chinese: "后侧" },
    Back: { Indonesia: "Belakang", English: "Back", Chinese: "背面" },
    "Top Down": { Indonesia: "Atas", English: "Top Down", Chinese: "俯视" },
    "Bottom Up": { Indonesia: "Bawah", English: "Bottom Up", Chinese: "仰视" },
    "Front Elevated": { Indonesia: "Depan Atas", English: "Front Elevated", Chinese: "前上方" },
    "Front Close-up": { Indonesia: "Close-up Depan", English: "Front Close-up", Chinese: "正面特写" }
  };

  return translations[angleName]?.[language] || angleName;
}

function buildMultiAngleFallbackResults(selectedAngles) {
  return selectedAngles.map((angle, index) => {
    var sourceFile = state.multiProductFiles[index % state.multiProductFiles.length];
    return {
      key: angle.key,
      name: angle.name,
      degrees: buildMultiAngleDegrees(angle.key),
      src: URL.createObjectURL(sourceFile)
    };
  });
}

function buildBgremoveModelLabel(model) {
  var labels = {
    quick: "Quick Remove (Default)",
    "quick-hd": "Quick Remove (HD)",
    fine: "Fine Remove",
    hair: "Hair Detail",
    portrait: "Model Portrait",
    adaptive: "Adaptive Size"
  };
  return labels[model] || "Quick Remove (Default)";
}

function buildLanguageInstruction(language) {
  var labels = {
    Indonesia: "Use Indonesian language for all visible copy, labels, and generated text.",
    English: "Use English language for all visible copy, labels, and generated text.",
    Chinese: "Use Simplified Chinese language for all visible copy, labels, and generated text."
  };
  return labels[language] || labels.English;
}

function getLanguageLabel(language, variants) {
  return variants[language] || variants.English;
}

function buildBgremoveFallbackResults() {
  var language = els.bgremoveLanguage.value;
  return state.bgremoveFiles.map((file, index) => {
    var src = URL.createObjectURL(file);
    return {
      beforeSrc: src,
      afterSrc: src,
      title: `${getLanguageLabel(language, {
        Indonesia: "Hapus Background",
        English: "Background Removal",
        Chinese: "背景移除"
      })} ${index + 1}`,
      modelLabel: buildBgremoveModelLabel(els.bgremoveModel.value)
    };
  });
}

async function generateMultiAngleImages() {
  if (!state.multiProductFiles.length) {
    els.multiStatus.textContent = "Upload at least one product image first.";
    return;
  }
  updateFeatureProgress("multi", { active: true, percent: 8, title: "Menyiapkan multi-angle", detail: "Memeriksa gambar produk dan prompt terpilih." });

  var selectedAngles = getSelectedAngleDefinitions();
  if (!selectedAngles.length) {
    els.multiStatus.textContent = "Pilih minimal satu prompt atau isi custom prompt.";
    return;
  }

  var aspectRatio = els.multiAspectRatio.value;
  var serializedFiles = await serializeFilesForBackend(state.multiProductFiles, 4);

  var results = [];

  for (var index = 0; index < selectedAngles.length; index += 1) {
    var angle = selectedAngles[index];
    els.multiStatus.textContent = `Generating ${angle.name} (${index + 1}/${selectedAngles.length})...`;
    updateFeatureProgress("multi", { active: true, percent: Math.round(18 + ((index / selectedAngles.length) * 72)), title: `Generating ${angle.name}`, detail: `Memproses sudut ${index + 1} dari ${selectedAngles.length}.` });
    var prompt = angle.prompt;
    var requestId = createGenerationRequest({
      feature: "Multi-Angle",
      provider: "backend-router",
      model: "backend-managed",
      apiBaseUrl: getBackendApiBaseUrl(),
      title: angle.name,
      prompt,
      input: {
        prompt,
        feature: "multi_angle",
        angle: angle.name,
        angle_key: angle.key,
        image_files: state.multiProductFiles.map((file) => file.name),
        aspect_ratio: aspectRatio,
        num_images: 1
      }
    });
    try {
      updateGenerationRequest(requestId, { progress: 45 });
      var generated = await backendGenerateImage("multi_angle", {
        language: els.multiLanguage?.value || "Indonesia",
        sellingPoints: els.multiSellingPoints?.value.trim() || "",
        basePrompt: prompt,
        extraPrompt: els.multiPrompt?.value.trim() || "",
        angleName: angle.name,
        aspectRatio,
        brandInfo: state.brandInfo,
        images: serializedFiles
      });
      var src = generated.images[0].src;
      updateGenerationRequest(requestId, {
        progress: 72,
        prompt: generated.prompt || prompt,
        provider: generated.task?.provider || "backend-router",
        model: generated.task?.model || "backend-managed"
      });
      finishGenerationRequest(requestId, {
        status: "success",
        images: [{ src, title: angle.name }],
        output: { images: [{ url: src, title: angle.name }] }
      });
      results.push({
        key: angle.key,
        name: angle.name,
        degrees: buildMultiAngleDegrees(angle.key),
        src
      });
    } catch (error) {
      finishGenerationRequest(requestId, { status: "error", error: error.message, output: { error: error.message } });
      throw error;
    }
    state.multiResults = [...results];
    renderMultiAngleResults();
  }

  els.multiStatus.textContent = `${results.length} image berhasil digenerate dari prompt terpilih.`;
  getSelectedMultiPrompts().forEach((prompt) => {
    if (prompt.feature === "multi_angle" && prompt.sourceKey) {
      incrementPromptUsage("multi_angle", prompt.sourceKey);
    }
  });
  addResultsToFolder("multi", results);
  updateFeatureProgress("multi", { active: true, percent: 100, title: "Generate multi-angle selesai", detail: `${results.length} output berhasil dibuat.` });
  await saveGenerationToSupabase("multi_angle", {
    aspectRatio,
    angles: selectedAngles,
    results
  });
}

async function enhanceSelectedMultiPrompts() {
  var selected = getSelectedMultiPrompts();
  if (!selected.length) {
    els.multiStatus.textContent = "Pilih minimal satu prompt untuk di-enhance.";
    return;
  }
  if (!getSettings().gptApiKey && !getSettings().apiKey) {
    els.multiStatus.textContent = "Isi GPT API Key di Admin untuk Enhance Prompt.";
    return;
  }
  var enhancedEntries = [];
  for (var index = 0; index < selected.length; index += 1) {
    var item = selected[index];
    els.multiStatus.textContent = `Enhancing prompt ${index + 1}/${selected.length}...`;
    var enhanced = await enhanceImagePrompt(item.content || "", `Multi-Angle: ${item.title}`);
    state.multiEnhancedPrompts[item.key] = enhanced;
    enhancedEntries.push({
      key: item.key,
      title: item.title,
      content: enhanced
    });
  }
  if (els.multiEnhancedPromptOutput) {
    els.multiEnhancedPromptOutput.value = serializeEnhancedMultiPrompts(enhancedEntries);
  }
  if (els.multiWebLikeMode) {
    els.multiWebLikeMode.checked = true;
  }
  els.multiStatus.textContent = `${enhancedEntries.length} prompt final siap dipakai dan bisa diedit.`;
}

async function enhanceListingPrompt() {
  var basePrompt = getSelectedPromptContent("listing", els.listingTemplate.value) || listingTemplatePrompts.premium;
  var raw = [
    els.listingSellingPoints.value.trim() ? `Product selling points:\n${els.listingSellingPoints.value.trim()}` : "",
    basePrompt,
    els.listingPrompt.value.trim()
  ].filter(Boolean).join("\n\n");
  if (!raw.trim()) {
    els.listingStatus.textContent = "Prompt listing kosong.";
    return;
  }
  if (!getSettings().gptApiKey && !getSettings().apiKey) {
    els.listingStatus.textContent = "Isi GPT API Key di Admin untuk Enhance Prompt.";
    return;
  }
  els.listingStatus.textContent = "Enhancing listing prompt...";
  var enhanced = await enhanceImagePrompt(raw, "Listing Images");
  if (els.listingEnhancedPrompt) {
    els.listingEnhancedPrompt.value = enhanced;
  }
  if (els.listingWebLikeMode) {
    els.listingWebLikeMode.checked = true;
  }
  els.listingStatus.textContent = "Prompt final listing siap dipakai dan bisa diedit.";
}

async function generateBackgroundRemoval() {
  if (!state.bgremoveFiles.length) {
    els.bgremoveStatus.textContent = "Upload at least one image first.";
    return;
  }
  updateFeatureProgress("bgremove", { active: true, percent: 8, title: "Menyiapkan background removal", detail: "Memeriksa file input dan mode output." });
  var modelValue = els.bgremoveModel.value;
  var modelLabel = buildBgremoveModelLabel(modelValue);
  var language = els.bgremoveLanguage.value;
  var resolution = els.bgremoveResolution.value;
  var format = els.bgremoveFormat.value;
  var refine = els.bgremoveRefine.checked;
  var presetPrompt = getSelectedPromptContent("bgremove", els.bgremovePromptPreset.value);
  var serializedFiles = await serializeFilesForBackend(state.bgremoveFiles, 4);

  var results = [];
  for (var index = 0; index < state.bgremoveFiles.length; index += 1) {
    var file = state.bgremoveFiles[index];
    els.bgremoveStatus.textContent = `Removing background ${index + 1}/${state.bgremoveFiles.length}...`;
    updateFeatureProgress("bgremove", { active: true, percent: Math.round(18 + ((index / state.bgremoveFiles.length) * 72)), title: `Removing background ${index + 1}/${state.bgremoveFiles.length}`, detail: `Memproses ${file.name}.` });
    var generated = await backendGenerateImage("bgremove", {
      language,
      cutoutModel: modelLabel,
      resolution,
      outputFormat: format,
      refine,
      basePrompt: presetPrompt,
      images: [serializedFiles[index]]
    });
    var src = generated.images[0].src;

    results.push({
      beforeSrc: URL.createObjectURL(file),
      afterSrc: src,
      title: file.name.replace(/\.[^.]+$/, ""),
      modelLabel
    });
    state.bgremoveResults = [...results];
    renderBgremoveResults();
  }

  els.bgremoveStatus.textContent = `${results.length} background removal selesai diproses.`;
  incrementPromptUsage("bgremove", els.bgremovePromptPreset.value);
  updateFeatureProgress("bgremove", { active: true, percent: 100, title: "Background removal selesai", detail: `${results.length} output berhasil dibuat.` });
}

async function analyzeAplusSellingPoints() {
  var platform = els.aplusPlatform.value;
  var aspectRatio = els.aplusAspectRatio.value;
  var language = els.aplusLanguage.value;
  var currentBrief = els.aplusSellingPoints.value.trim();

  return backendEnhanceImagePrompt(`Create structured A+ selling points for this product.
Platform: ${platform}
Aspect ratio: ${aspectRatio}
Language instruction: ${buildLanguageInstruction(language)}
Current brief:
${currentBrief || "-"}

Return in this format:
Product name:
Core selling points:
Target audience:
Expected scenes:
Size parameters:
Brand tone:`, "A+ Selling Points");
}

async function generateListingImages() {
  if (!state.listingProductFiles.length) {
    els.listingStatus.textContent = "Upload at least one product image first.";
    return;
  }
  updateFeatureProgress("listing", { active: true, percent: 8, title: "Menyiapkan listing image", detail: "Memeriksa gambar produk, quantity, dan prompt aktif." });

  var quantity = Math.min(5, Math.max(1, Number(els.listingQuantity.value) || 1));
  var basePrompt = getSelectedPromptContent("listing", els.listingTemplate.value) || listingTemplatePrompts.premium;
  var extraPrompt = els.listingPrompt.value.trim();
  var sellingPoints = els.listingSellingPoints.value.trim();
  var language = els.listingLanguage.value;
  var summary = extractSellingPointSummary(sellingPoints);
  var serializedFiles = await serializeFilesForBackend(state.listingProductFiles, 4);

  var results = [];

  for (var index = 0; index < quantity; index += 1) {
    els.listingStatus.textContent = `Generating listing image ${index + 1} of ${quantity}...`;
    updateFeatureProgress("listing", { active: true, percent: Math.round(18 + ((index / quantity) * 72)), title: `Generating listing ${index + 1}/${quantity}`, detail: `Menyusun output ${index + 1} dari ${quantity}.` });
    var prompt = els.listingWebLikeMode?.checked && els.listingEnhancedPrompt?.value.trim()
      ? `${els.listingEnhancedPrompt.value.trim()}
Variation ${index + 1} of ${quantity}.`
      : `${basePrompt}
${extraPrompt}`.trim();
    var requestTitle = buildListingCardTitle(index, language, summary);
    var requestId = createGenerationRequest({
      feature: "Listing Image",
      provider: "backend-router",
      model: "backend-managed",
      apiBaseUrl: getBackendApiBaseUrl(),
      title: requestTitle,
      prompt,
      input: {
        prompt,
        feature: "listing",
        language,
        selling_points: sellingPoints,
        variation: index + 1,
        image_size: els.listingSize.value,
        image_files: state.listingProductFiles.map((file) => file.name),
        num_images: 1
      }
    });
    try {
      updateGenerationRequest(requestId, { progress: 45 });
      var generated = await backendGenerateImage("listing", {
        language,
        sellingPoints,
        basePrompt,
        extraPrompt: prompt,
        quantity,
        variation: index + 1,
        imageSize: els.listingSize.value,
        brandInfo: state.brandInfo,
        images: serializedFiles
      });
      var src = generated.images[0].src;
      updateGenerationRequest(requestId, {
        progress: 72,
        prompt: generated.prompt || prompt,
        provider: generated.task?.provider || "backend-router",
        model: generated.task?.model || "backend-managed"
      });
      finishGenerationRequest(requestId, {
        status: "success",
        images: [{ src, title: requestTitle }],
        output: { images: [{ url: src, title: requestTitle }] }
      });
      results.push({
        src,
        title: requestTitle,
        description: buildListingCardDescription(index, sellingPoints, extraPrompt),
        badges: buildListingBadges(index, language)
      });
    } catch (error) {
      finishGenerationRequest(requestId, { status: "error", error: error.message, output: { error: error.message } });
      throw error;
    }
    state.listingResults = [...results];
    renderListingResults();
  }

  els.listingStatus.textContent = `${results.length} listing images berhasil digenerate.`;
  incrementPromptUsage("listing", els.listingTemplate.value);
  addResultsToFolder("listing", results);
  updateFeatureProgress("listing", { active: true, percent: 100, title: "Generate listing selesai", detail: `${results.length} output berhasil dibuat.` });
  await saveGenerationToSupabase("listing", {
    language,
    sellingPoints,
    brandInfo: state.brandInfo,
    quantity,
    results
  });
}

function extractSellingPointSummary(text) {
  var cleanLines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[\-\d\.\:•\s]+/, ""));

  if (!cleanLines.length) {
    return "Premium product storytelling";
  }

  return cleanLines[0].slice(0, 70);
}

function buildListingCardTitle(index, language, summary) {
  var localized = {
    Indonesia: ["Hero Utama", "Fokus Benefit", "Detail Produk", "Penggunaan Produk", "Banner Konversi"],
    English: ["Hero Cover", "Benefit Focus", "Product Detail", "Usage Scene", "Conversion Banner"],
    Chinese: ["主视觉", "核心卖点", "产品细节", "使用场景", "转化横幅"]
  };
  var set = localized[language] || localized.English;
  var titles = [
    set[0],
    set[1],
    set[2],
    set[3],
    set[4]
  ];

  return titles[index] || set[0];
}

function buildListingCardDescription(index, sellingPoints, extraPrompt) {
  var fallbackCopy = [
    "Main hero image with strong product hierarchy, premium visibility, and clear marketplace appeal.",
    "Benefit-forward layout that spotlights the biggest customer value and buying reason.",
    "Detail-focused frame highlighting craftsmanship, texture, material quality, or core function.",
    "Usage-oriented visual showing how the product fits real customer scenarios and expectations.",
    "Promotional closing frame with stronger urgency, stronger CTA space, and campaign-ready energy."
  ];

  var sourceText = extraPrompt || sellingPoints;
  if (!sourceText.trim()) {
    return fallbackCopy[index] || fallbackCopy[0];
  }

  var clean = sourceText.replace(/\s+/g, " ").trim();
  return clean.slice(0, 140);
}

function buildListingBadges(index, language) {
  var localized = {
    Indonesia: [
      ["Hero", "Tinggi CTR", "Visual Utama"],
      ["Benefit", "Marketplace", "Jualan"],
      ["Detail", "Zoom", "Produk"],
      ["Lifestyle", "Trust", "Scene"],
      ["Promo", "Affiliate", "Konversi"]
    ],
    English: [
      ["Hero", "High CTR", "Primary Visual"],
      ["Benefits", "Marketplace", "Sales"],
      ["Detail", "Zoom Ready", "Product"],
      ["Lifestyle", "Trust", "Scene"],
      ["Promo", "Affiliate", "Conversion"]
    ],
    Chinese: [
      ["主图", "高点击", "核心视觉"],
      ["卖点", "平台适配", "转化"],
      ["细节", "可放大", "产品"],
      ["场景", "信任感", "展示"],
      ["促销", "联盟", "转化"]
    ]
  };
  var set = localized[language] || localized.English;
  var badgeSets = [
    set[0],
    set[1],
    set[2],
    set[3],
    set[4]
  ];

  return badgeSets[index] || set[0];
}

function buildListingFallbackResults({ quantity, language, sellingPoints, extraPrompt, summary }) {
  return Array.from({ length: quantity }, (_, index) => {
    var sourceFile = state.listingProductFiles[index % state.listingProductFiles.length];
    return {
      src: URL.createObjectURL(sourceFile),
      title: buildListingCardTitle(index, language, summary),
      description: buildListingCardDescription(index, sellingPoints, extraPrompt),
      badges: buildListingBadges(index, language)
    };
  });
}

function downloadListingResults() {
  if (!state.listingResults.length) {
    els.listingStatus.textContent = "Belum ada hasil image untuk diunduh.";
    return;
  }

  state.listingResults.forEach((item, index) => {
    var link = document.createElement("a");
    link.href = item.src;
    link.download = `listing-image-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  els.listingStatus.textContent = `${state.listingResults.length} image berhasil dipersiapkan untuk diunduh.`;
}

function downloadMultiResults() {
  if (!state.multiResults.length) {
    els.multiStatus.textContent = "Belum ada hasil multi-angle untuk diunduh.";
    return;
  }

  state.multiResults.forEach((item, index) => {
    var link = document.createElement("a");
    link.href = item.src;
    link.download = `multi-angle-${String(index + 1).padStart(2, "0")}-${item.key}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  els.multiStatus.textContent = `${state.multiResults.length} multi-angle image siap diunduh.`;
}

function downloadMultiResultAt(index) {
  var item = state.multiResults[index];
  if (!item) {
    return;
  }
  var link = document.createElement("a");
  link.href = item.src;
  link.download = `multi-angle-${String(index + 1).padStart(2, "0")}-${item.key}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function downloadBgremoveResults() {
  if (!state.bgremoveResults.length) {
    els.bgremoveStatus.textContent = "Belum ada hasil background removal untuk diunduh.";
    return;
  }

  state.bgremoveResults.forEach((item, index) => {
    var link = document.createElement("a");
    link.href = item.afterSrc;
    link.download = `background-removed-${String(index + 1).padStart(2, "0")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  els.bgremoveStatus.textContent = `${state.bgremoveResults.length} hasil background removal siap diunduh.`;
}

function downloadBgremoveResultAt(index) {
  var item = state.bgremoveResults[index];
  if (!item) {
    return;
  }
  var link = document.createElement("a");
  link.href = item.afterSrc;
  link.download = `background-removed-${String(index + 1).padStart(2, "0")}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function bindUploads() {
  safeBind(els.listingUploadBtn, "click", () => els.listingProductUpload.click());
  safeBind(els.multiUploadBtn, "click", () => els.multiProductUpload.click());
  safeBind(els.bgremoveUploadBtn, "click", () => els.bgremoveUpload.click());
  safeBind(els.aplusUploadBtn, "click", () => els.aplusProductUpload.click());
  safeBind(els.aplusReferenceBtn, "click", () => els.aplusReferenceUpload.click());
  safeBind(els.promptImageBtn, "click", () => els.promptImageUpload.click());

  safeBind(els.listingProductUpload, "change", () => {
    var incomingFiles = Array.from(els.listingProductUpload.files || []);
    state.listingProductFiles = mergeFiles(state.listingProductFiles, incomingFiles, 8);
    renderListingUploadList();
    els.listingProductUpload.value = "";
  });

  safeBind(els.multiProductUpload, "change", () => {
    var incomingFiles = Array.from(els.multiProductUpload.files || []);
    state.multiProductFiles = mergeFiles(state.multiProductFiles, incomingFiles, 8);
    renderMultiUploadList();
    els.multiProductUpload.value = "";
  });

  safeBind(els.bgremoveUpload, "change", () => {
    var incomingFiles = Array.from(els.bgremoveUpload.files || []);
    state.bgremoveFiles = mergeFiles(state.bgremoveFiles, incomingFiles, 8);
    renderBgremoveUploadList();
    els.bgremoveUpload.value = "";
  });

  safeBind(els.aplusProductUpload, "change", () => {
    state.aplusProductFiles = Array.from(els.aplusProductUpload.files || []).slice(0, 5);
    renderThumbnailList(els.aplusUploadList, state.aplusProductFiles);
    updatePreviewFromUploads();
    renderAplusGridFromModules();
    updateAplusCounts();
  });

  safeBind(els.aplusReferenceUpload, "change", () => {
    state.aplusReferenceFiles = Array.from(els.aplusReferenceUpload.files || []).slice(0, 5);
    renderThumbnailList(els.aplusReferenceList, state.aplusReferenceFiles);
    updateAplusCounts();
  });

  safeBind(els.promptImageUpload, "change", () => {
    var incomingFiles = Array.from(els.promptImageUpload.files || []);
    var remaining = Math.max(0, 8 - state.promptExistingImages.length);
    state.promptPreviewFiles = mergeFiles(state.promptPreviewFiles, incomingFiles, remaining);
    renderPromptImageList();
    previewPromptFromForm();
    els.promptImageUpload.value = "";
  });
}

function bindModuleCards() {
  els.moduleCards.forEach((card) => {
    card.addEventListener("click", () => {
      var key = card.dataset.moduleKey;
      if (!key) {
        return;
      }

      if (state.selectedModules.has(key)) {
        state.selectedModules.delete(key);
        card.classList.remove("active");
      } else {
        state.selectedModules.add(key);
        card.classList.add("active");
      }

      renderAplusGridFromModules();
      updateAplusCounts();
    });
  });
}

function bindMultiAngleTiles() {
  safeBind(els.multiPromptList, "change", (event) => {
    var input = event.target instanceof HTMLElement ? event.target.closest("[data-multi-prompt-key]") : null;
    if (!input) {
      return;
    }
    var key = input.getAttribute("data-multi-prompt-key");
    if (!key) {
      return;
    }
    state.selectedMultiPromptTouched = true;
    if (input.checked) {
      state.selectedMultiPromptKeys.add(key);
    } else {
      state.selectedMultiPromptKeys.delete(key);
    }
    renderMultiPromptList();
  });

  els.multiAngleTiles.forEach((tile) => {
    tile.addEventListener("click", () => {
      var key = tile.dataset.angleKey;
      if (!key) {
        return;
      }

      if (state.selectedAngles.has(key)) {
        state.selectedAngles.delete(key);
        tile.classList.remove("active");
      } else {
        state.selectedAngles.add(key);
        tile.classList.add("active");
      }

      updateMultiAngleCount();
    });
  });
}

function bindWorkspaceTabs() {
  els.workspaceTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      var target = tab.dataset.workspaceTarget;
      if (target) {
        switchWorkspace(target);
      }
    });
  });
}

function bindEvents() {
  bindWorkspaceTabs();
  bindUploads();
  bindModuleCards();
  bindMultiAngleTiles();
  bindRequestEvents();

  safeBind(els.saveSettingsBtn, "click", saveSettings);
  safeBind(els.clearSettingsBtn, "click", clearSettings);
  safeBind(els.testGptConnectionBtn, "click", async () => {
    els.gptConnectionStatus.textContent = "Menguji...";
    try {
      els.gptConnectionStatus.textContent = await testApiConnection("gpt");
    } catch (error) {
      els.gptConnectionStatus.textContent = error.message.startsWith("Gagal:") ? error.message : `Gagal: ${error.message}`;
    }
  });
  safeBind(els.testGeminiConnectionBtn, "click", async () => {
    els.geminiConnectionStatus.textContent = "Menguji...";
    try {
      els.geminiConnectionStatus.textContent = await testApiConnection("gemini");
    } catch (error) {
      els.geminiConnectionStatus.textContent = error.message.startsWith("Gagal:") ? error.message : `Gagal: ${error.message}`;
    }
  });
  safeBind(els.testFalConnectionBtn, "click", async () => {
    els.falConnectionStatus.textContent = "Menguji...";
    try {
      els.falConnectionStatus.textContent = await testApiConnection("fal");
    } catch (error) {
      els.falConnectionStatus.textContent = error.message.startsWith("Gagal:") ? error.message : `Gagal: ${error.message}`;
    }
  });
  safeBind(els.testCustomConnectionBtn, "click", async () => {
    els.customConnectionStatus.textContent = "Menguji...";
    try {
      els.customConnectionStatus.textContent = await testApiConnection("custom");
    } catch (error) {
      els.customConnectionStatus.textContent = error.message.startsWith("Gagal:") ? error.message : `Gagal: ${error.message}`;
    }
  });
  safeBind(els.folderToggleBtn, "click", () => {
    els.folderDropdown.classList.toggle("hidden");
    els.folderToggleIcon.textContent = els.folderDropdown.classList.contains("hidden") ? "expand_more" : "expand_less";
  });
  [
    els.listingProvider, els.listingImageModel, els.listingQuantity, els.listingSize, els.listingLanguage, els.listingSellingPoints, els.listingTemplate, els.listingPrompt,
    els.multiProvider, els.multiImageModel, els.multiAspectRatio, els.multiTemplate, els.multiPrompt,
    els.aplusProvider, els.aplusImageModel, els.aplusPlatform, els.aplusLanguage, els.aplusAspectRatio, els.aplusPromptPreset, els.aplusSellingPoints, els.aplusDesignRequirements,
    els.bgremoveProvider, els.bgremoveImageModel, els.bgremoveModel, els.bgremovePromptPreset, els.bgremoveLanguage, els.bgremoveResolution, els.bgremoveFormat, els.bgremoveRefine,
    els.falImageSize, els.falQuality
  ].forEach((element) => {
    safeBind(element, "input", updateAllEstimateBadges);
    safeBind(element, "change", updateAllEstimateBadges);
  });
  safeBind(els.promptFeature, "change", () => {
    resetPromptForm(els.promptFeature.value, !els.promptEditorDialog?.classList.contains("hidden"));
  });
  safeBind(els.promptTitle, "input", () => {
    if (!els.promptKey.value.trim() || !state.activePromptKey) {
      els.promptKey.value = slugifyPromptKey(els.promptTitle.value);
    }
    previewPromptFromForm();
  });
  safeBind(els.promptNewBtn, "click", () => {
    resetPromptForm("listing", true);
  });
  safeBind(els.promptSaveBtn, "click", () => {
    savePromptFromForm().catch((error) => {
      els.promptStatus.textContent = error.message || "Prompt gagal disimpan.";
    });
  });
  safeBind(els.promptDeleteBtn, "click", () => {
    deletePromptFromForm();
  });
  safeBind(els.promptPreviewBtn, "click", () => {
    previewPromptFromForm();
    openFormPromptPreview();
  });
  safeBind(els.promptEditorCloseBtn, "click", () => {
    closePromptEditor();
  });
  safeBind(els.promptPreviewCloseBtn, "click", () => {
    closePromptPreviewDialog();
  });
  safeBind(els.promptManualImageBtn, "click", () => {
    openPromptManualImageDialog();
  });
  safeBind(els.promptManualImageCloseBtn, "click", () => {
    closePromptManualImageDialog();
  });
  safeBind(els.promptManualImageSaveBtn, "click", () => {
    savePromptManualImageFromDialog().catch((error) => {
      els.promptStatus.textContent = error.message || "Simpan gambar manual gagal.";
    });
  });
  safeBind(els.promptPropertyCloseBtn, "click", () => {
    closePromptPropertyDialog();
  });
  safeBind(els.promptPropertySaveBtn, "click", () => {
    createPromptProperty();
  });
  safeBind(els.promptPreviewCopyAllBtn, "click", async () => {
    if (!els.promptPreviewBody) {
      return;
    }
    var payload = els.promptPreviewBody.innerText || "";
    await copyTextToClipboard(payload);
    els.promptStatus.textContent = "Ringkasan preview berhasil disalin.";
  });
  safeBind(els.promptPreviewBody, "click", (event) => {
    var button = event.target instanceof HTMLElement ? event.target.closest("[data-prompt-copy]") : null;
    if (!button) {
      return;
    }
    var pair = button.getAttribute("data-prompt-copy");
    var payload = getPromptByFeaturePair(pair);
    if (!payload) {
      return;
    }
    var field = button.getAttribute("data-prompt-copy-field") || "content";
    var copyValue = field === "summary"
      ? buildPromptSummaryText(payload.prompt, payload.feature)
      : (field === "title" ? payload.prompt.title || "" : payload.prompt.content || "");
    copyTextToClipboard(copyValue).then(() => {
      els.promptStatus.textContent = `Kolom ${field} berhasil disalin.`;
    });
  });
  safeBind(els.promptList, "click", (event) => {
    var button = event.target instanceof HTMLElement ? event.target.closest("[data-prompt-edit],[data-prompt-preview],[data-prompt-use],[data-prompt-copy],[data-prompt-toggle-feature],[data-prompt-add-property],[data-prompt-add-row],[data-prompt-delete-property],[data-prompt-toggle-bulk-delete],[data-prompt-delete-selected]") : null;
    if (!button) {
      return;
    }
    var bulkToggleFeature = button.getAttribute("data-prompt-toggle-bulk-delete");
    if (bulkToggleFeature) {
      togglePromptBulkDeleteMode(bulkToggleFeature);
      return;
    }
    var bulkDeleteFeature = button.getAttribute("data-prompt-delete-selected");
    if (bulkDeleteFeature) {
      deleteSelectedPromptRows(bulkDeleteFeature);
      return;
    }
    var deletePropertyPair = button.getAttribute("data-prompt-delete-property");
    if (deletePropertyPair) {
      var deleteParts = deletePropertyPair.split(":");
      var deleteFeature = deleteParts.shift();
      var deletePropertyId = deleteParts.join(":");
      if (deleteFeature && deletePropertyId) {
        deletePromptProperty(deleteFeature, deletePropertyId);
      }
      return;
    }
    var addPropertyFeature = button.getAttribute("data-prompt-add-property");
    if (addPropertyFeature) {
      openPromptPropertyDialog(addPropertyFeature);
      return;
    }
    var addRowFeature = button.getAttribute("data-prompt-add-row");
    if (addRowFeature) {
      createPromptRow(addRowFeature);
      return;
    }
    var featureToggle = button.getAttribute("data-prompt-toggle-feature");
    if (featureToggle) {
      state.promptExpandedFeatures[featureToggle] = !state.promptExpandedFeatures[featureToggle];
      renderPromptList();
      return;
    }
    var pair = button.getAttribute("data-prompt-edit") || button.getAttribute("data-prompt-preview") || button.getAttribute("data-prompt-use") || button.getAttribute("data-prompt-copy");
    if (!pair) {
      return;
    }
    var parts = pair.split(":");
    var feature = parts.shift();
    var key = parts.join(":");
    if (!feature || !key) {
      return;
    }
    if (button.hasAttribute("data-prompt-copy")) {
      var payload = getPromptByFeaturePair(pair);
      if (!payload) {
        return;
      }
      var field = button.getAttribute("data-prompt-copy-field") || "content";
      var copyValue = field === "summary"
        ? buildPromptSummaryText(payload.prompt, feature)
        : (field === "title" ? payload.prompt.title || "" : payload.prompt.content || "");
      copyTextToClipboard(copyValue).then(() => {
        els.promptStatus.textContent = `Kolom ${field} berhasil disalin.`;
      });
      return;
    }
    if (button.hasAttribute("data-prompt-use")) {
      setPromptUseFlag(feature, key, !!button.checked);
      return;
    }
    if (button.hasAttribute("data-prompt-preview")) {
      openStoredPromptPreview(feature, key);
      return;
    }
    loadPromptIntoForm(feature, key);
  });
  safeBind(els.promptList, "change", (event) => {
    var target = event.target instanceof HTMLElement ? event.target : null;
    if (!target) {
      return;
    }
    if (target.matches("[data-prompt-bulk-row]")) {
      var bulkPair = target.getAttribute("data-prompt-bulk-row") || "";
      var bulkPayload = getPromptByFeaturePair(bulkPair);
      if (bulkPayload && target instanceof HTMLInputElement) {
        togglePromptSelectedRow(bulkPayload.feature, bulkPayload.key, target.checked);
      }
      return;
    }
    if (target.matches("[data-prompt-inline-file]")) {
      var pair = target.getAttribute("data-prompt-inline-file");
      var field = target.getAttribute("data-prompt-field") || "";
      var propertyId = target.getAttribute("data-prompt-property") || "";
      var payload = getPromptByFeaturePair(pair);
      if (!payload) {
        return;
      }
      updatePromptInlineFiles(payload.feature, payload.key, field, Array.from(target.files || []), propertyId).catch((error) => {
        els.promptStatus.textContent = error.message || "Upload file property gagal.";
      });
      target.value = "";
      return;
    }
    if (!target.matches("[data-prompt-inline]")) {
      return;
    }
    var pair = target.getAttribute("data-prompt-inline");
    var field = target.getAttribute("data-prompt-field") || "";
    var propertyId = target.getAttribute("data-prompt-property") || "";
    var payload = getPromptByFeaturePair(pair);
    if (!payload) {
      return;
    }
    var value;
    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      value = target.checked;
    } else if (target instanceof HTMLSelectElement && target.multiple) {
      value = Array.from(target.selectedOptions).map((option) => option.value);
    } else {
      value = target.value;
    }
    if (field === "custom" && propertyId) {
      updatePromptInlineValue(payload.feature, payload.key, "custom", value, propertyId);
    } else {
      updatePromptInlineValue(payload.feature, payload.key, field, value);
    }
    els.promptStatus.textContent = `Prompt ${payload.prompt.title} diperbarui langsung dari tabel.`;
  });
  safeBind(els.promptMemoryList, "click", (event) => {
    var target = event.target instanceof HTMLElement ? event.target.closest("[data-prompt-edit],[data-prompt-manual-delete],[data-prompt-manual-preview]") : null;
    if (!target) {
      return;
    }
    var manualPreviewId = target.getAttribute("data-prompt-manual-preview");
    if (manualPreviewId) {
      var manualItem = (state.promptManualImages || []).find((item) => item.id === manualPreviewId);
      if (manualItem) {
        renderPromptPreviewDialog({
          feature: "listing",
          title: manualItem.name || "Preview Gambar",
          prompt: {
            key: manualItem.id,
            title: manualItem.name || "Gambar",
            tag: "",
            rating: 0,
            generator: "Manual",
            placement: "Library",
            background: "-",
            usePrompt: true,
            usageCount: 0,
            content: manualItem.description || "",
            customProperties: {},
            images: [manualItem.src]
          }
        });
        return;
      }
    }
    var manualDeleteId = target.getAttribute("data-prompt-manual-delete");
    if (manualDeleteId) {
      deletePromptManualImage(manualDeleteId);
      return;
    }
    var button = target.closest("[data-prompt-edit]");
    if (!button) {
      return;
    }
    var pair = button.getAttribute("data-prompt-edit");
    if (!pair) {
      return;
    }
    var parts = pair.split(":");
    var feature = parts.shift();
    var key = parts.join(":");
    if (feature && key) {
      loadPromptIntoForm(feature, key);
    }
  });
  safeBind(els.promptManualImageUpload, "change", () => {
    addPromptManualImages(Array.from(els.promptManualImageUpload?.files || [])).catch((error) => {
      els.promptStatus.textContent = error.message || "Upload gambar manual gagal.";
    });
    els.promptManualImageUpload.value = "";
  });
  safeBind(els.promptImageList, "click", (event) => {
    var target = event.target instanceof HTMLElement ? event.target.closest("[data-prompt-remove-existing],[data-prompt-remove-upload]") : null;
    if (!target) {
      return;
    }
    if (target.hasAttribute("data-prompt-remove-existing")) {
      var existingIndex = Number(target.getAttribute("data-prompt-remove-existing"));
      if (!Number.isNaN(existingIndex)) {
        state.promptExistingImages.splice(existingIndex, 1);
      }
    }
    if (target.hasAttribute("data-prompt-remove-upload")) {
      var uploadIndex = Number(target.getAttribute("data-prompt-remove-upload"));
      if (!Number.isNaN(uploadIndex)) {
        state.promptPreviewFiles.splice(uploadIndex, 1);
      }
    }
    renderPromptImageList();
    previewPromptFromForm();
  });
  [els.promptKey, els.promptRating, els.promptTag, els.promptGenerator, els.promptPlacement, els.promptBackground, els.promptContent, els.promptUse].forEach((element) => {
    safeBind(element, "input", previewPromptFromForm);
    safeBind(element, "change", previewPromptFromForm);
  });
  safeBind(els.brandLogo, "change", async () => {
    var file = els.brandLogo.files?.[0];
    if (!file) {
      state.brandInfo.logoDataUrl = "";
      renderBrandInfo();
      return;
    }

    try {
      state.brandInfo.logoDataUrl = await readFileAsDataUrl(file);
      renderBrandInfo();
      if (els.brandStatus) {
        els.brandStatus.textContent = "Logo brand berhasil dimuat. Klik Simpan Brand Info untuk menyimpan permanen.";
      }
    } catch (error) {
      if (els.brandStatus) {
        els.brandStatus.textContent = error.message;
      }
    }
  });
  safeBind(els.brandSaveBtn, "click", () => {
    collectBrandInfoFromForm();
    saveBrandInfo();
    renderBrandInfo();
    if (els.brandStatus) {
      els.brandStatus.textContent = "Brand information berhasil disimpan dan siap dipakai sebagai acuan generate.";
    }
  });
  safeBind(els.brandClearBtn, "click", () => {
    clearBrandInfo();
  });
  ["input", "change"].forEach((eventName) => {
    safeBind(els.brandName, eventName, () => {
      collectBrandInfoFromForm();
      renderBrandInfo();
    });
    safeBind(els.brandProductCategory, eventName, () => {
      collectBrandInfoFromForm();
      renderBrandInfo();
    });
    safeBind(els.brandStoreReputation, eventName, () => {
      collectBrandInfoFromForm();
      renderBrandInfo();
    });
    safeBind(els.brandDescription, eventName, () => {
      collectBrandInfoFromForm();
      renderBrandInfo();
    });
  });

  safeBind(els.styleModeTrending, "click", () => setStyleMode("trending"));
  safeBind(els.styleModeReference, "click", () => setStyleMode("reference"));

  safeBind(els.oneClickAnalysisBtn, "click", async () => {
    els.aplusGenerateHint.textContent = "Analyzing product brief with GPT...";
    try {
      els.aplusSellingPoints.value = await analyzeAplusSellingPoints();
      els.aplusGenerateHint.textContent = "Product brief berhasil dianalisis dari API Admin.";
    } catch (error) {
      els.aplusSellingPoints.value = `Product name: Premium fashion top
Core selling points: modern silhouette, refined collar contrast, stretch comfort, polished styling
Target audience: women age 20-35
Expected scenes: office, city walk, casual chic lifestyle
Size parameters: S, M, L, XL`;
      els.aplusGenerateHint.textContent = `${error.message} Fallback brief digunakan.`;
    }
    updateAllEstimateBadges();
  });

  safeBind(els.generateSellingPointsBtn, "click", async () => {
    els.aplusGenerateHint.textContent = "Generating selling points with GPT...";
    try {
      els.aplusSellingPoints.value = await analyzeAplusSellingPoints();
      els.aplusGenerateHint.textContent = "Selling points berhasil dibuat dari API Admin.";
    } catch (error) {
      if (!els.aplusSellingPoints.value.trim()) {
        els.aplusSellingPoints.value = `Product name:
Core selling points:
Target audience:
Expected scenes:
Size parameters:`;
      } else {
        els.aplusSellingPoints.value += `\nAdditional value: premium visual storytelling`;
      }
      els.aplusGenerateHint.textContent = `${error.message} Template lokal digunakan.`;
    }
    updateAllEstimateBadges();
  });

  safeBind(els.trendingStyleAnalysisBtn, "click", async () => {
    setStyleMode("trending");
    var moduleSummary = buildAplusModuleSummary();
    var platform = els.aplusPlatform.value;
    var aspectRatio = els.aplusAspectRatio.value;
    var language = els.aplusLanguage.value;
    var sellingPoints = els.aplusSellingPoints.value.trim();
    var aplusPreset = getSelectedPromptContent("aplus", els.aplusPromptPreset.value);

    els.aplusGenerateHint.textContent = "Running GPT trending style analysis...";

    try {
      var content = await backendEnhanceImagePrompt(`Create a trending style analysis for A+ content.
Platform: ${platform}
Aspect ratio: ${aspectRatio}
Language instruction: ${buildLanguageInstruction(language)}
Selling points:
${sellingPoints || "-"}
Prompt preset:
${aplusPreset || "-"}

Include modules as prompt references:
${moduleSummary}

Return a concise style direction, layout guidance, typography cue, color cue, and composition strategy.`, "A+ Trending Style");

      els.aplusDesignRequirements.value = content;
      els.aplusGenerateHint.textContent = "Trending style analysis from GPT berhasil dimuat.";
    } catch (error) {
      els.aplusDesignRequirements.value = `Fallback style direction:
- Platform: ${platform}
- Aspect Ratio: ${aspectRatio}
- Language: ${language}
- Mood: premium clean commercial image
- Composition: hero-led layout with supporting module blocks
- Module reference:
${moduleSummary}`;
      els.aplusGenerateHint.textContent = `${error.message} Fallback style direction digunakan.`;
    }
  });

  safeBind(els.listingTemplate, "change", () => {
    var basePrompt = getSelectedPromptContent("listing", els.listingTemplate.value) || listingTemplatePrompts.premium;
    els.listingPrompt.value = basePrompt;
  });
  safeBind(els.listingProvider, "change", () => {
    syncImageControls(els.listingProvider, els.listingImageModel);
  });
  safeBind(els.aplusProvider, "change", () => {
    syncImageControls(els.aplusProvider, els.aplusImageModel);
  });
  safeBind(els.multiProvider, "change", () => {
    syncImageControls(els.multiProvider, els.multiImageModel);
  });
  safeBind(els.bgremoveProvider, "change", () => {
    syncImageControls(els.bgremoveProvider, els.bgremoveImageModel);
  });

  safeBind(els.aplusPromptPreset, "change", () => {
    var preset = getSelectedPromptContent("aplus", els.aplusPromptPreset.value);
    if (!els.aplusDesignRequirements.value.trim()) {
      els.aplusDesignRequirements.value = preset;
    }
  });

  safeBind(els.listingPreviewModeBtn, "click", () => {
    state.listingPreviewMode = state.listingPreviewMode === "fit" ? "fill" : "fit";
    updateListingCanvasControls();
    renderListingResults();
  });

  safeBind(els.listingAutoLayoutBtn, "click", () => {
    state.listingAutoLayout = !state.listingAutoLayout;
    updateListingCanvasControls();
    renderListingResults();
  });

  safeBind(els.listingDownloadBtn, "click", () => {
    downloadListingResults();
  });
  safeBind(els.listingEnhancePromptBtn, "click", async () => {
    var originalText = els.listingEnhancePromptBtn.textContent;
    els.listingEnhancePromptBtn.textContent = "Enhancing...";
    els.listingEnhancePromptBtn.disabled = true;
    try {
      await enhanceListingPrompt();
    } catch (error) {
      els.listingStatus.textContent = error.message;
    } finally {
      els.listingEnhancePromptBtn.textContent = originalText;
      els.listingEnhancePromptBtn.disabled = false;
    }
  });

  safeBind(els.generateAplusBtn, "click", async () => {
    if (!state.aplusProductFiles.length) {
      els.aplusGenerateHint.textContent = "Please upload at least one product image first";
      return;
    }
    try {
      var generated = await generateAplusImagesWithProvider();
      if (generated) {
        return;
      }
    } catch (error) {
      els.aplusGenerateHint.textContent = `${error.message} Preview lokal tetap dibuat.`;
      updateFeatureProgress("aplus", { active: true, percent: 100, title: "Fallback preview aktif", detail: error.message });
    }
    var platform = els.aplusPlatform.value;
    var aspectRatio = els.aplusAspectRatio.value;
    var language = els.aplusLanguage.value;
    var moduleSummary = buildAplusModuleSummary();
    var aplusPreset = getSelectedPromptContent("aplus", els.aplusPromptPreset.value);
    if (!els.aplusDesignRequirements.value.trim()) {
      try {
        els.aplusDesignRequirements.value = await backendEnhanceImagePrompt(`Build concise A+ generation direction.
Platform: ${platform}
Aspect ratio: ${aspectRatio}
Language instruction: ${buildLanguageInstruction(language)}
Selling points:
${els.aplusSellingPoints.value.trim() || "-"}
Prompt preset:
${aplusPreset || "-"}

Selected modules:
${moduleSummary}

Provide a short generation direction for the selected A+ grid modules.`, "A+ Design Direction");
      } catch (error) {
        els.aplusGenerateHint.textContent = `${error.message} Preview lokal tetap dibuat.`;
      }
    }
    generateAplusPreview();
    var aplusAssets = state.aplusProductFiles.map((file, index) => ({
      src: URL.createObjectURL(file),
      title: `A+ Asset ${index + 1}`
    }));
    addResultsToFolder("aplus", aplusAssets);
    updateFeatureProgress("aplus", { active: true, percent: 100, title: "Preview A+ selesai", detail: `${aplusAssets.length} asset preview sudah ditampilkan.` });
    await saveGenerationToSupabase("aplus_content", {
      platform,
      aspectRatio,
      language,
      brandInfo: state.brandInfo,
      modules: Array.from(state.selectedModules),
      designRequirements: els.aplusDesignRequirements.value.trim()
    });
  });

  safeBind(els.generateListingBtn, "click", async () => {
    var originalText = els.generateListingBtn.textContent;
    els.generateListingBtn.textContent = "Generating...";
    els.generateListingBtn.disabled = true;
    try {
      await generateListingImages();
    } catch (error) {
      state.listingResults = buildListingFallbackResults({
        quantity: Math.min(5, Math.max(1, Number(els.listingQuantity.value) || 1)),
        language: els.listingLanguage.value,
        sellingPoints: els.listingSellingPoints.value.trim(),
        extraPrompt: els.listingPrompt.value.trim(),
        summary: extractSellingPointSummary(els.listingSellingPoints.value.trim())
      });
      renderListingResults();
      addResultsToFolder("listing", state.listingResults.map((item) => ({
        ...item,
        title: item.title
      })));
      els.listingStatus.textContent = `${error.message} Preview lokal ditampilkan sebagai fallback.`;
      updateFeatureProgress("listing", { active: true, percent: 100, title: "Fallback preview aktif", detail: error.message });
    } finally {
      els.generateListingBtn.textContent = originalText;
      els.generateListingBtn.disabled = false;
    }
  });

  safeBind(els.multiTemplate, "change", () => {
    state.selectedMultiPromptKeys.clear();
    state.selectedMultiPromptTouched = false;
    renderMultiPromptList();
    els.multiStatus.textContent = `List prompt aktif: ${els.multiTemplate.options[els.multiTemplate.selectedIndex]?.text || "-"}`;
  });
  safeBind(els.multiPrompt, "input", () => {
    renderMultiPromptList();
  });

  safeBind(els.bgremovePromptPreset, "change", () => {
    els.bgremoveStatus.textContent = `Prompt preset aktif: ${els.bgremovePromptPreset.options[els.bgremovePromptPreset.selectedIndex]?.text || "-"}`;
  });

  safeBind(els.multiSelectAllBtn, "click", () => {
    state.selectedMultiPromptTouched = true;
    getCurrentMultiPromptOptions().forEach((prompt) => state.selectedMultiPromptKeys.add(prompt.key));
    renderMultiPromptList();
  });

  safeBind(els.multiClearBtn, "click", () => {
    state.selectedMultiPromptTouched = true;
    state.selectedMultiPromptKeys.clear();
    renderMultiPromptList();
  });
  safeBind(els.multiEnhancePromptBtn, "click", async () => {
    var originalText = els.multiEnhancePromptBtn.textContent;
    els.multiEnhancePromptBtn.textContent = "Enhancing...";
    els.multiEnhancePromptBtn.disabled = true;
    try {
      await enhanceSelectedMultiPrompts();
    } catch (error) {
      els.multiStatus.textContent = error.message;
    } finally {
      els.multiEnhancePromptBtn.textContent = originalText;
      els.multiEnhancePromptBtn.disabled = false;
    }
  });
  safeBind(els.multiClearEnhancedBtn, "click", () => {
    state.multiEnhancedPrompts = {};
    if (els.multiEnhancedPromptOutput) {
      els.multiEnhancedPromptOutput.value = "";
    }
    els.multiStatus.textContent = "Enhanced prompt dibersihkan.";
  });

  safeBind(els.generateMultiBtn, "click", async () => {
    var originalText = els.generateMultiBtn.textContent;
    els.generateMultiBtn.textContent = "Generating...";
    els.generateMultiBtn.disabled = true;
    try {
      await generateMultiAngleImages();
    } catch (error) {
      if (!state.multiResults.length) {
        state.multiResults = buildMultiAngleFallbackResults(getSelectedAngleDefinitions());
        renderMultiAngleResults();
        addResultsToFolder("multi", state.multiResults);
        els.multiStatus.textContent = `${error.message} Preview lokal multi-angle ditampilkan sebagai fallback.`;
        updateFeatureProgress("multi", { active: true, percent: 100, title: "Fallback preview aktif", detail: error.message });
      } else {
        els.multiStatus.textContent = `${error.message} Hasil AI yang sudah jadi tetap dipertahankan.`;
        updateFeatureProgress("multi", { active: true, percent: 100, title: "Generate multi-angle selesai dengan kendala", detail: error.message });
      }
    } finally {
      els.generateMultiBtn.textContent = originalText;
      els.generateMultiBtn.disabled = false;
    }
  });

  safeBind(els.multiDownloadBtn, "click", () => {
    downloadMultiResults();
  });

  safeBind(els.generateBgremoveBtn, "click", async () => {
    var originalText = els.generateBgremoveBtn.textContent;
    els.generateBgremoveBtn.textContent = "Processing...";
    els.generateBgremoveBtn.disabled = true;
    try {
      await generateBackgroundRemoval();
    } catch (error) {
      if (!state.bgremoveResults.length) {
        state.bgremoveResults = buildBgremoveFallbackResults();
        renderBgremoveResults();
      }
      els.bgremoveStatus.textContent = `${error.message} Preview lokal before/after ditampilkan sebagai fallback.`;
      updateFeatureProgress("bgremove", { active: true, percent: 100, title: "Fallback preview aktif", detail: error.message });
    } finally {
      els.generateBgremoveBtn.textContent = originalText;
      els.generateBgremoveBtn.disabled = false;
    }
  });

  safeBind(els.bgremoveDownloadBtn, "click", () => {
    downloadBgremoveResults();
  });

  safeBind(els.multiPreviewGrid, "click", (event) => {
    var button = event.target instanceof HTMLElement ? event.target.closest("[data-multi-download-index]") : null;
    if (!button) {
      return;
    }
    var index = Number(button.getAttribute("data-multi-download-index"));
    downloadMultiResultAt(index);
  });

  safeBind(els.bgremovePreviewGrid, "click", (event) => {
    var button = event.target instanceof HTMLElement ? event.target.closest("[data-bgremove-download-index]") : null;
    if (!button) {
      return;
    }
    var index = Number(button.getAttribute("data-bgremove-download-index"));
    downloadBgremoveResultAt(index);
  });
}

function init() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getSettings()));
  ensureBackendGatewayField();
  loadFolderLibrary();
  loadBrandInfo();
  loadPromptStore();
  loadRequestHistory();
  loadSettingsIntoForm();
  syncAllImageControls();
  renderBrandInfo();
  updateApiStatus();
  updateFolderCounts();
  updateAplusCounts();
  setStyleMode("trending");
  switchWorkspace(window.__ajwGiActiveWorkspace || "listing-images");
  renderListingUploadList();
  renderMultiUploadList();
  renderBgremoveUploadList();
  renderMultiPromptList();
  updateMultiAngleCount();
  updateListingCanvasControls();
  renderListingResults();
  renderMultiAngleResults();
  renderBgremoveResults();
  renderAplusGridFromModules();
  syncPromptSelectors();
  renderPromptList();
  els.listingPrompt.value = getSelectedPromptContent("listing", els.listingTemplate.value) || listingTemplatePrompts.premium;
  if (els.aplusPromptPreset.value) {
    els.aplusDesignRequirements.value = getSelectedPromptContent("aplus", els.aplusPromptPreset.value);
  }
  renderPromptImageList();
  renderRequestHistory();
  resetFeatureProgress("listing");
  resetFeatureProgress("aplus");
  resetFeatureProgress("multi");
  resetFeatureProgress("bgremove");
  updateAllEstimateBadges();
  if (state.requestHistory.length) {
    renderRequestDetail(state.activeRequestId || state.requestHistory[0].id);
  }
  resetPromptForm("listing", false);
  bindEvents();
}

init();


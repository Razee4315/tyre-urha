#[cfg(target_os = "android")]
use log::LevelFilter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "android")]
    android_logger::init_once(
        android_logger::Config::default()
            .with_max_level(LevelFilter::Info)
            .with_tag("TauriTemplate"),
    );

    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running Saqlain's Tauri Template");
}

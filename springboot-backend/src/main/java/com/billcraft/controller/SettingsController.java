package com.billcraft.controller;

import com.billcraft.domain.entity.AppSetting;
import com.billcraft.repository.AppSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final AppSettingRepository settingRepository;

    @GetMapping
    public ResponseEntity<Map<String, String>> getAll() {
        Map<String, String> settings = settingRepository.findAll().stream()
                .collect(Collectors.toMap(AppSetting::getSettingKey, s -> s.getSettingValue() != null ? s.getSettingValue() : ""));
        return ResponseEntity.ok(settings);
    }

    @PutMapping
    public ResponseEntity<Map<String, String>> update(@RequestBody Map<String, String> settings) {
        settings.forEach((key, value) -> {
            AppSetting setting = settingRepository.findById(key).orElse(AppSetting.builder().settingKey(key).build());
            setting.setSettingValue(value);
            settingRepository.save(setting);
        });
        return getAll();
    }
}

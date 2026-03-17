# ERPVerse

## Current State
v49 has Data Export module. Audit Log panel already exists. 49 versions of incremental ERP features implemented.

## Requested Changes (Diff)

### Add
- Import tab to DataExportModule: file picker, JSON parsing, module detection, confirmation warning, restore to localStorage
- Translation keys: dataexport.exportTab, importTab, importSubtitle, importButton, importSuccess, importError, importWarning, selectFile for all 8 languages

### Modify
- DataExportModule: add Export/Import tab switcher, import flow with file read, preview of modules, confirmation step

### Remove
- Nothing removed

## Implementation Plan
1. Add translation keys to LanguageContext for all 8 languages
2. Update DataExportModule with tabbed interface (Export + Import)
3. Import tab: file picker dropzone, JSON parse, module list preview, confirmation dialog, localStorage restore

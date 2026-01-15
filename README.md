# FilterLab
## Summary
This PR initializes the `FilterLab-ng-app` project, setting up the core application structure and the DevOps pipeline.

## Key Changes
1. **Project Setup**:
   - Renamed and configured project as `FilterLab-ng-app`.
   - Updated `angular.json` and package settings.

2. **UI Implementation**:
   - Created the main landing view.
   - Implemented the preview canvas wrapper with centered layout (Flexbox).
   - Added conditional hint text for image uploading.

3. **CI/CD Integration**:
   - Added GitHub Actions workflow (`.github/workflows/`).
   - Pipeline is configured to trigger on push/merge to the `main` branch.
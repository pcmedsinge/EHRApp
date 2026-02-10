/**
 * OHIF Viewer Configuration
 * Phase: 5C (OHIF Viewer Integration)
 * 
 * This configuration connects OHIF Viewer to Orthanc PACS via DICOMweb
 */

window.config = {
  routerBasename: '/',
  showStudyList: true,
  
  // Extensions
  extensions: [],
  modes: [],
  
  // Custom CSS (optional)
  customizationService: {
    dicomUploadComponent: null,
  },

  // DICOMweb Data Sources
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        friendlyName: 'EHR Orthanc PACS',
        
        // Orthanc DICOMweb endpoints
        wadoUriRoot: 'http://localhost:8042/wado',
        qidoRoot: 'http://localhost:8042/dicom-web',
        wadoRoot: 'http://localhost:8042/dicom-web',
        
        // Query/Retrieve Configuration
        qidoSupportsIncludeField: false,
        supportsReject: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        
        // Request Options
        requestOptions: {
          requestFromBrowser: true,
          
          // Basic Authentication for Orthanc
          auth: 'orthanc:orthanc',
          
          // Headers
          headers: {
            // 'Authorization': 'Basic ' + btoa('orthanc:orthanc')
          },
        },
        
        // Enable Study Prefetcher
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: false,
        
        // Bulk data URI root
        bulkDataURI: {
          enabled: true,
          relativeResolution: 'studies',
        },
      },
    },
  ],

  // Default Data Source
  defaultDataSourceName: 'dicomweb',

  // Hotkeys Configuration
  hotkeys: [
    {
      commandName: 'incrementActiveViewport',
      label: 'Next Viewport',
      keys: ['right'],
    },
    {
      commandName: 'decrementActiveViewport',
      label: 'Previous Viewport',
      keys: ['left'],
    },
    {
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Zoom' },
      label: 'Zoom',
      keys: ['z'],
    },
    {
      commandName: 'setToolActive',
      commandOptions: { toolName: 'WindowLevel' },
      label: 'Window/Level',
      keys: ['w'],
    },
    {
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Pan' },
      label: 'Pan',
      keys: ['p'],
    },
    {
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Length' },
      label: 'Length Measurement',
      keys: ['l'],
    },
    {
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Angle' },
      label: 'Angle Measurement',
      keys: ['a'],
    },
    {
      commandName: 'resetViewport',
      label: 'Reset Viewport',
      keys: ['space'],
    },
    {
      commandName: 'flipViewportHorizontal',
      label: 'Flip Horizontal',
      keys: ['h'],
    },
    {
      commandName: 'flipViewportVertical',
      label: 'Flip Vertical',
      keys: ['v'],
    },
    {
      commandName: 'rotateViewportCW',
      label: 'Rotate Right',
      keys: ['r'],
    },
    {
      commandName: 'rotateViewportCCW',
      label: 'Rotate Left',
      keys: ['l'],
    },
    {
      commandName: 'invertViewport',
      label: 'Invert',
      keys: ['i'],
    },
    {
      commandName: 'scaleUpViewport',
      label: 'Zoom In',
      keys: ['+'],
    },
    {
      commandName: 'scaleDownViewport',
      label: 'Zoom Out',
      keys: ['-'],
    },
  ],
};

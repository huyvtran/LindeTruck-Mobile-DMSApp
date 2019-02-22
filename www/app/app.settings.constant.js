/**
 * general app settings
 */
angular.module('oinio.settings', [])

    .constant('APP_SETTINGS', {
        'VERSION': '1.0.0',
        'DEBUG_ROUTING': true,
        'LOCAL_LOGIN': false,
        'TOUCH_ID': false,
        'GLOBAL_SOUP_CONFIGURATION_FILE': 'app/core/configuration/global_soups.json',
        'FRAMEWORK_SOUP_CONFIGURATION_FILE': 'app/core/configuration/framework_soups.json',
        'TRUCK_ERROR_CODE_FILE': 'app/core/configuration/errorCode.json',
        'LOCAL_CONFIGURATION': true,
        'LOCAL_CONFIGURATION_FILE': 'app/common/configuration/objects.json',
        'MOBILE_CONFIGURATION_FILE': 'app/core/configuration/mobile_configuration_soups.json', // also known as remote configuration file
        'GENERIC_CONFIGURATION': false,
        'SYNCHRONIZE_AFTER_LOGIN': true,
        'SYNCHRONIZE_AFTER_TIME_INTERVAL': true,
        'SYNCHRONIZE_TIME_INTERVAL': 14400, // 4 hours in seconds
        'HIDE_HEADER_SEARCH': false,
        'DARK_THEME': false,        //if true then dark theme will used in the styling for login screen
        'START_VIEW': 'app.home',
        'MANDATORY_OBJECTS': 'Account,Contact',
        'DROP_DATABASE_ON_VERSION_CHANGE': true
    })
    .constant('SYNC_PAGE_SIZE', {
        'SYNC_UP_RECORDS': 200,
        'DOWNLOAD_RECORDS_BY_ID': 2000,
        'CLEAN_UP_DOWNLOAD_DELTA_SHARED_RECORDS': 10000, // Approach1
        'CLEAN_UP_DOWNLOAD_CHILD_RECORDS': 100, // Approach1
        'CLEAN_UP_CHECK_RECORDS_EXISTENCE': 10000, // Approach1
        'CLEAN_UP_DOWNLOAD_ALL_RECORDS_ID': 50000, // Approach2
        'REBUILD_REFERENCE': 2500 // 2500 seemed to be a good compromise between performance and memory consumption
    })
    .constant('LOG_SETTING', {
        'LOGGING': true,      // whether enable logging, default is false
        'LOG_LEVEL': 'log',     // log level, one of debug(0), info(1), warn(2), error(3) and log(4)
        'LOG_FILE_SIZE': 512,      // kB, default is (5*1024)kB
        'LOG_FILE_WRITING_BATCH_SIZE': 10, // kB, default is 10kB
        'LOG_FILE_WRITING_INTERVAL_TIME': 1000, // ms(recommend: [500~5000]), if log level is more lower, the interval time should be more smaller, for keeping the RAM lower
        'LOG_FILE_EXPIRED_TIME': 36,      // hour, default is 36h(from last modified time to now)
        'SEND_LOG_FILE_EMAIL_TO': '@163.com', // Array(['demo1@gmail.com', 'demo2@gmail.com']) or string(single email such as 'demo@gmail.com')
        'SEND_LOG_FILE_EMAIL_SUBJECT': 'AVANTO logfiles', // email subject, such as 'Logfiles for <the app name>'
        'SEND_LOG_FILE_EMAIL_BODY': '',
        'DEFAULT_LOG_FOLDER': 'AVANTO logfiles', // please use the chatter group name, such as 'All oinioone playground'
        'LOG_FILE_UPLOAD_ROUTING': true // use routing function to manage the share of log files, if this is true, sharing to chatter group 'DEFAULT_LOG_FOLDER' won't work.
    });

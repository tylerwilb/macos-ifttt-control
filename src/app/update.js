/**
 * Backend script.
 */
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;
const {ipcRenderer} = require('electron');
const appVersion = require('./package.json').version;
const request = require('request');

/**
 * Frontend script.
 */
(function () {
    /*!
     * Update application
     */
    $(document.body).on('click', '.btn.update', function () {
        // Show loading spinner
        $('#loading_spinner').fadeIn();
        $('.btn.update').removeClass('update').addClass('disabled');

        // Execute update script
        let update_script = path.join(__dirname, './cli/update.php');
        exec('php ' + update_script, function (error, stdout, stderr) {
            console.log(stdout);

            // electron-reload is a main-process development helper. Do not
            // load it in a packaged renderer; quit after the updater finishes.
            ipcRenderer.send('app:quit');
        });

    });

    /*!
     * Get application version
     */
    jQuery(document).ready(function () {
        // Get current version
        let version = appVersion;
        $('#current_version').text(version);

        // Get remote version
        let package_url = 'https://raw.githubusercontent.com/abdyfranco/macos-ifttt-control/master/src/app/package.json';

        request({
            url: package_url,
            json: true
        }, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                $('#new_version').text(body.version);
            }
        });
    });

})(window);

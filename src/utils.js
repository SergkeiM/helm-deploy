import {
    getInput
} from '@actions/core'

export const vars = (data) => {
    if (typeof data === "string") {
        try {
            return JSON.parse(data);
        } catch (err) {
            return data;
        }
    }
    return data;
}

export const values = (files) => {
    let fileList;

    if (typeof files === "string") {
        try {
        fileList = JSON.parse(files);
        } catch (err) {
        // Assume it's a single string.
        fileList = [files];
        }
    } else {
        fileList = files;
    }

    if (!Array.isArray(fileList)) {
        return [];
    }

    return fileList.filter(f => !!f);
}

export const input = (name, required = false) => {

    let val = getInput(name, {
        required
    });

    if (required && !val) {
        throw new Error(`Input required and not supplied: ${name}`);
    }

    return val;
}

/**
* Makes a delete command helm.
*
* @param {string} namespace
* @param {string} release
*/
export const deleteCmd = (namespace, release) => ["delete", "-n", namespace, release]
import { readFile, writeFile } from 'fs/promises'
import envsub from 'envsub'
import mustache from 'mustache'
import { debug } from '@actions/core'

//Do not escape HTML (Things like: / or = are escaped to &#x2F; &#x3D;)
mustache.escape = (value) => value;

const tags = ["${{", "}}"];

/**
 * Render files renders data into the list of provided files.
 * @param {Array<string>} files
 * @param {Object} data
 */
export const render = (files, data) => {

    debug(`rendering value files [${files.join(",")}] with: ${JSON.stringify(data)}`);
    
    const promises = files.map(async outputFile => {

        const content = await readFile(outputFile, { encoding: "utf8" });
        const rendered = mustache.render(content, data, {}, tags);

        await writeFile(`${outputFile}.tpl`, rendered);

        await envsub({
            templateFile: `${outputFile}.tpl`,
            outputFile,
            options: {
                syntax: 'dollar-curly'
            }
        })
        
    });

    return Promise.all(promises);
}

export const setKubeConfig = async () => {
    
    if (process.env.KUBECONFIG_FILE) {

        process.env.KUBECONFIG = "./kubeconfig.yml";
        await writeFile(process.env.KUBECONFIG, process.env.KUBECONFIG_FILE);

        debug(`env: KUBECONFIG="${process.env.KUBECONFIG}"`);
    }
}
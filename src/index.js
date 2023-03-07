import * as core from '@actions/core'
import * as exec from '@actions/exec'

import * as files from './files.js'
import * as utils from './utils.js'

import { Util } from '@docker/actions-toolkit/lib/util.js';

/**
 * Run executes the helm deployment.
 */
async function run() {

    try {

        const release = utils.input("release", true);
        const namespace = utils.input("namespace", true);
        const chart = utils.input("chart", true);
        const chartVersion = utils.input("chart-version");
        const task = utils.input("task");
        const version = utils.input("version");
        const values = utils.values(utils.input("values"));
        
        const timeout = utils.input("timeout");
        const repository = utils.input("repository");
        const dryRun = core.getInput("dry-run");
        const secrets = utils.vars(core.getInput("secrets"));
        const vars = utils.vars(core.getInput("vars"));
        const atomic = utils.input("atomic") || true;

        const inputArgs = Util.getInputList('args', {
            ignoreComma: true
        })

        core.debug(`param: release = "${release}"`);
        core.debug(`param: namespace = "${namespace}"`);
        core.debug(`param: chart = "${chart}"`);
        core.debug(`param: chart-version = "${chartVersion}"`);
        core.debug(`param: dryRun = "${dryRun}"`);
        core.debug(`param: task = "${task}"`);
        core.debug(`param: version = "${version}"`);
        core.debug(`param: secrets = "${JSON.stringify(secrets)}"`);
        core.debug(`param: vars = "${JSON.stringify(vars)}"`);
        core.debug(`param: values = "${JSON.stringify(values)}"`);
        core.debug(`param: timeout = "${timeout}"`);
        core.debug(`param: repository = "${repository}"`);
        core.debug(`param: atomic = "${atomic}"`);

        // Setup kubeconfig
        await files.setKubeConfig()

        // Setup command options and arguments.
        const args = [
            "upgrade",
            release,
            chart,
            "--install",
            "--wait",
            "--create-namespace",
            `--namespace=${namespace}`,
        ];

        inputArgs.forEach(arg => args.push(arg));
        
        values.forEach(f => args.push(`--values=${f}`));

        if (dryRun) args.push("--dry-run");
        if (release) args.push(`--set=app.name=${release}`);
        if (version) args.push(`--set=app.version=${version}`);
        if (chartVersion) args.push(`--version=${chartVersion}`);
        if (timeout) args.push(`--timeout=${timeout}`);
        if (repository) args.push(`--repo=${repository}`);

        // If true upgrade process rolls back changes made in case of failed upgrade.
        if (atomic === true) {
            args.push("--atomic");
        }

        // Render value files using github variables.
        await files.render(values, {
            secrets,
            vars
        });

        // Execute the deployment here.
        if (task === "remove") {
            await exec.exec("helm", utils.deleteCmd(namespace, release), {
                ignoreReturnCode: true
            });
        } else {
            await exec.exec("helm", args);
        }

    } catch (error) {

        core.error(error);
        core.setFailed(error.message);
    }
}

run();
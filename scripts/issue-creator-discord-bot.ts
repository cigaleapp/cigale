import { RestEndpointMethodTypes } from '@octokit/rest';
import arkenv from 'arkenv';
import { regex } from 'arktype';
import * as DiscordJS from 'discord.js';
import { TextInputStyle } from 'discord.js';
import { App } from 'octokit';

const env = arkenv({
	'PORT?': 'number.port',
	GITHUB_APP_ID: 'string > 0',
	GITHUB_APP_INSTALLATION_ID: 'string.integer.parse',
	GITHUB_APP_KEY_FILE: 'string',
	GITHUB_USERNAME: 'string > 0',
	BOT_TOKEN: 'string > 0',
	GUILD_ID: 'string.integer > 0',
	GITHUB_REPOSITORY: [
		regex('^(?<owner>[^/]+)/(?<repo>[^/]+)$'),
		'=>',
		(repoAndOwner) => {
			const [owner, repo] = repoAndOwner.split('/', 2);
			return { owner, repo };
		}
	]
});

const reporter = new App({
	appId: env.GITHUB_APP_ID,
	privateKey: await Bun.file(env.GITHUB_APP_KEY_FILE).text(),
	log: console
});

const gh = await reporter.getInstallationOctokit(env.GITHUB_APP_INSTALLATION_ID);

const { owner, repo } = env.GITHUB_REPOSITORY;

const { data: repository } = await gh.rest.repos.get({ owner, repo });
console.info(`Acting on ${repository.full_name}`);

const client = new DiscordJS.Client({
	intents: ['Guilds', 'GuildMessages']
});

client.on('clientReady', async () => {
	console.log('Bot is ready.');
	const guildId = process.env.GUILD_ID || '';

	const guild = client.guilds.cache.get(guildId);
	if (!guild) {
		throw new Error('Guild not found');
	}

	const commands = guild.commands;

	for (const [, cmd] of await commands.fetch()) {
		await commands.delete(cmd.id);
	}

	await commands.create({
		name: 'To Github Bug',
		type: 3
	});

	await commands.create({
		name: 'To Github Feature Request',
		type: 3
	});

	await commands.create({
		name: 'To Github Task',
		type: 3
	});
});

client.on('interactionCreate', async (interaction) => {
	if (interaction.isMessageContextMenuCommand()) {
		const { commandName, targetMessage, user } = interaction;
		console.log(`Received command ${commandName} from ${user.tag}`);
		const githubIssueCommand = /^To Github (?<type>Bug|Feature Request|Task)$/.exec(
			commandName
		);
		if (githubIssueCommand) {
			const { data: labels } = await gh.rest.issues
				.listLabelsForRepo({ owner, repo })
				.catch(() => ({ data: [] }));

			const { data: issueTypes } = await gh
				.request('GET /orgs/{org}/issue-types', { org: owner })
				.catch(() => ({ data: [] }));

			const { data: milestones } = await gh.rest.issues
				.listMilestones({ owner, repo })
				.catch(() => ({ data: [] }));

			const { data: collaborators } = await gh.rest.repos
				.listCollaborators({ owner, repo })
				.catch(() => ({ data: [] }));

			const modal = getModal({
				id: `create github issue ${githubIssueCommand.groups?.type}`,
				user,
				message: targetMessage,
				labels,
				issueTypes,
				milestones,
				collaborators
			});
			interaction.showModal(modal);
		}
	} else if (interaction.isModalSubmit()) {
		const { fields, customId } = interaction;
		console.log(`Received modal submit ${interaction.customId} from ${interaction.user.tag}`);
		const title = fields.getTextInputValue('title');
		const body = fields.getTextInputValue('desc');
		const labels = fields.fields.has('labels') ? fields.getStringSelectValues('labels') : [];
		const [milestone] = fields.fields.has('milestone')
			? fields.getStringSelectValues('milestone')
			: [];
		const [assignee] = fields.fields.has('assignee')
			? fields.getStringSelectValues('assignee')
			: [];

		const type =
			{
				Task: 'Task',
				Bug: 'Bug',
				'Feature Request': 'Feature'
				// "Dependencies",
			}[customId.replace('create github issue ', '')] ?? null;

		console.log(`Creating issue with`, {
			title,
			body,
			labels,
			milestone,
			assignee,
			type
		});

		const { data: issue } = await gh.rest.issues.create({
			owner,
			repo,
			title,
			body,
			milestone,
			assignee,
			labels: [...labels],
			type
		});

		await interaction.reply(`[Created #${issue.number}](${issue.html_url})`);
	}
});

client.login(process.env.BOT_TOKEN);

export const getModal = ({
	id,
	user,
	message,
	labels,
	issueTypes,
	milestones,
	collaborators
}: {
	id: string;
	user: DiscordJS.User;
	message: DiscordJS.Message<boolean>;
	labels: RestEndpointMethodTypes['issues']['listLabelsForRepo']['response']['data'];
	issueTypes: Array<{
		id: number;
		name: string;
		description: string;
		color: string;
		is_enabled: boolean;
	}>;
	milestones: RestEndpointMethodTypes['issues']['listMilestones']['response']['data'];
	collaborators: RestEndpointMethodTypes['repos']['listCollaborators']['response']['data'];
}) => {
	return createModal(id, 'Create GitHub Issue', {
		Title: textInput('title*', TextInputStyle.Short),
		// Can't have more than 5 fields in a modal
		// Type: selectOneMenu("type*", issueTypes),
		Description: textInput('desc*', TextInputStyle.Paragraph, {
			default: [
				'---',
				`_Issue created by ${user.tag} [via Discord](${message.url}):_`,
				'',
				...message.content.split('\n').map((line) => `> ${line}`),
				'',
				`— ${message.author.displayName} (${message.author.tag})`,
				''
			].join('\n')
		}),
		Labels: selectMultipleMenu('labels', labels),
		Milestone: selectOneMenu('milestone', milestones),
		Assignee: selectOneMenu(
			'assignee',
			collaborators.map(({ login, name }) => ({
				name: login,
				description: name
			}))
		)
	});
};

function createModal(
	id: string,
	title: string,
	fields: Record<
		string,
		DiscordJS.StringSelectMenuBuilder | DiscordJS.TextInputBuilder | undefined
	>
): DiscordJS.ModalBuilder {
	return new DiscordJS.ModalBuilder()
		.setCustomId(id)
		.setTitle(title)
		.addLabelComponents(
			...Object.entries(fields)
				.filter(([, field]) => field !== undefined)
				.map(([label, field]) => {
					const builtLabel = new DiscordJS.LabelBuilder().setLabel(label);

					if (field instanceof DiscordJS.StringSelectMenuBuilder) {
						builtLabel.setStringSelectMenuComponent(field);
					} else if (field instanceof DiscordJS.TextInputBuilder) {
						builtLabel.setTextInputComponent(field);
					}

					return builtLabel;
				})
		);
}

function selectOneMenu(
	id: string,
	options: Parameters<typeof selectMenu>[2]
): DiscordJS.StringSelectMenuBuilder | undefined {
	return selectMenu(id, { multiple: false }, options);
}

function selectMultipleMenu(
	id: string,
	options: Parameters<typeof selectMenu>[2]
): DiscordJS.StringSelectMenuBuilder | undefined {
	return selectMenu(id, { multiple: true }, options);
}

/**
 * Returns undefined if there are no options
 */
function selectMenu(
	id: string,
	params: { multiple?: boolean },
	options: Array<
		| { name: string; description?: string | null }
		| { title: string; description?: string | null }
	>
): DiscordJS.StringSelectMenuBuilder | undefined {
	if (options.length === 0) {
		return undefined;
	}

	const { customId, required } = parseFieldId(id);
	const menu = new DiscordJS.StringSelectMenuBuilder()
		.setCustomId(customId)
		.setRequired(required);

	options = options.slice(0, 25);

	if (params.multiple) {
		menu.setMaxValues(options.length);
	}

	menu.setMinValues(required ? 1 : 0);

	menu.addOptions(
		options.map(({ description, ...nameOrTitle }) => {
			const name = 'name' in nameOrTitle ? nameOrTitle.name : nameOrTitle.title;
			const menu = new DiscordJS.StringSelectMenuOptionBuilder()
				.setLabel(name)
				.setValue(name);
			if (description) menu.setDescription(description);
			return menu;
		})
	);

	return menu;
}

function textInput(
	id: string,
	style: DiscordJS.TextInputStyle,
	params: { default?: string } = {}
): DiscordJS.TextInputBuilder {
	const { customId, required } = parseFieldId(id);

	const input = new DiscordJS.TextInputBuilder()
		.setCustomId(customId)
		.setStyle(style)
		.setRequired(required);

	if (params.default) input.setValue(params.default);

	return input;
}

function parseFieldId(id: string): { customId: string; required: boolean } {
	const [customId, _] = id.split('*');
	const required = id.endsWith('*');
	return { customId, required };
}

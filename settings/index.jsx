import { client } from './secrets.js';

function mySettings(props) {
	return (
		<Page>

		<Section
		title={<Text bold align="center">Drink Selection</Text>}>
		<Toggle
		settingsKey="coffee"
		label="coffee"
		/>
		<Toggle
		settingsKey="tea"
		label="tea"
		/>
		<Toggle
		settingsKey="energy"
		label="energy drink"
		/>
		</Section>

		<Section
		title={<Text bold align="center">Color Selection</Text>}>
		<ColorSelect
		settingsKey="color"
		colors={[
			{color: 'orange'},
			{color: 'tomato'},
			{color: 'gold'},
			{color: 'aquamarine'},
			{color: 'deepskyblue'},
			{color: 'plum'}
		]}
		/>
		</Section>

		<Section
		title={<Text bold align="center">Login to log to nutrition</Text>}>
		<Oauth
		settingsKey="oauth"
		title="Login"
		label="Fitbit"
		status="Login"
		authorizeUrl="https://www.fitbit.com/oauth2/authorize"
		requestTokenUrl="https://api.fitbit.com/oauth2/token"
		clientId={client.id}
		clientSecret={client.secret}
		scope="nutrition"
		/>
		</Section>
		</Page>
	);
}

registerSettingsPage(mySettings);

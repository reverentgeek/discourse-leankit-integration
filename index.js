"use strict";

const axios = require( "axios" );
const dotenv = require( "dotenv" );
dotenv.config();

function formatCustomId( id ) {
	return `Forum: ${ id }`;
}

async function getTopics( baseUrl, slug, topicId, days ) {
	try {
		const dt = new Date();
		dt.setDate( dt.getDate() - days );

		const config = {
			method: "get",
			url: `${ baseUrl }/c/${ slug }/${ topicId }.json`
		};

		const res = await axios( config );
		const topics = res.data["topic_list"].topics;
		// console.log( topics );
		return topics.filter( t => {
			const d = new Date( Date.parse( t.last_posted_at ) );
			return d > dt;
		} );
	} catch ( err ) {
		console.log( err );
		return [];
	}
}

async function getCardByCustomId( id ) {
	try {
		const {
			LK_HOST: host,
			LK_USERNAME: username,
			LK_PASSWORD: password
		} = process.env;

		const config = {
			method: "get",
			url: `https://${ host }.leankit.com/io/card/?customId=${ formatCustomId( id ) }`,
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json"
			},
			auth: {
				username, password
			}
		};

		const res = await axios( config );
		return res.data.cards;

	} catch ( err ) {
		console.log( err );
		return [];
	}
}

async function createCard( { title, id, url } ) {
	try {
		const {
			LK_HOST: host,
			LK_USERNAME: username,
			LK_PASSWORD: password,
			LK_BOARD_ID: boardId,
			LK_TYPE_ID: typeId,
			LK_LANE_ID: laneId
		} = process.env;

		const config = {
			method: "post",
			url: `https://${ host }.leankit.com/io/card`,
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json"
			},
			auth: {
				username, password
			},
			data: {
				boardId,
				title,
				typeId,
				laneId,
				index: 0,
				customId: formatCustomId( id ),
				externalLink: {
					label: "Forum Post",
					url
				}
			}
		};

		const res = await axios( config );
		return res.data;

	} catch ( err ) {
		console.log( err );
		return "Error: " + err.message;
	}
}

( async () => {
	const {
		DISCOURSE_BASE_URL: baseUrl,
		DISCOURSE_TOPIC_SLUG: slug,
		DISCOURSE_TOPIC_ID: topicId,
		DISCOURSE_DAYS_TO_SEARCH: days
	} = process.env;

	const topics = await getTopics( baseUrl, slug, topicId, days );
	for( const { id, title, slug: topicSlug } of topics ) {
		const cards = await getCardByCustomId( id );
		if ( !cards.length ) {
			console.log( `Creating card for [${ id }], [${ title }]` );
			const url = `${ baseUrl }/t/${ topicSlug }/${ id }`;
			await createCard( { title, id, url } );
		}
	}
} )();

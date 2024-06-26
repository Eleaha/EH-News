const app = require('../app');
const request = require('supertest');
const db = require('../db/connection');
const seed = require('../db/seeds/seed');
const data = require('../db/data/test-data/index');
const endpoints = require('../endpoints');

afterAll(() => {
	db.end();
});

beforeEach(() => {
	return seed(data);
});

describe('general errors', () => {
	test("ANY 404: returns a 404 error when given a path that doesn't exist", () => {
		return request(app)
			.get('/api/garbage')
			.expect(404)
			.then(({ body }) => {
				expect(body.msg).toBe('Not found');
			});
	});
});

describe('/api/topics', () => {
	test('GET 200: returns all of the topics', () => {
		return request(app)
			.get('/api/topics')
			.expect(200)
			.then(({ body }) => {
				const { topics } = body;
				expect(topics.length).toBe(3);
				topics.forEach((topic) => {
					expect(topic).toMatchObject({
						description: expect.any(String),
						slug: expect.any(String),
					});
				});
			});
	});
	describe('POST /api/topics', () => {
		test('POST 201: responds with the newly created topic object', () => {
			const postBody = {
				slug: 'foccacia',
				description: 'all about tasty italian bread',
			};
			return request(app)
				.post('/api/topics')
				.send(postBody)
				.expect(201)
				.then(({ body }) => {
					const { newTopic } = body;
					expect(newTopic).toMatchObject({
						slug: 'foccacia',
						description: 'all about tasty italian bread',
					});
				});
		});
		test('POST 400: invalid post object format', () => {
			const postBody = {
				slug: 'foccacia',
				garbage: 'all about tasty italian bread',
			};
			return request(app)
				.post('/api/topics')
				.send(postBody)
				.expect(400)
				.then(({ body }) => {
					expect(body.msg).toBe('Bad request');
				});
		});
	});
});

describe('/api', () => {
	test('GET 200: returns the same information in the endpoints json to the client', () => {
		return request(app)
			.get('/api')
			.expect(200)
			.then(({ body }) => {
				expect(body.endpoints).toEqual(endpoints);
			});
	});
});

describe('/api/articles/:article_id', () => {
	describe('GET /api/articles/:article_id', () => {
		test('GET 200: Responds with the article that corresponds with the given article id', () => {
			return request(app)
				.get('/api/articles/2')
				.expect(200)
				.then(({ body }) => {
					const { article } = body;
					expect(article).toMatchObject({
						article_id: 2,
						title: 'Sony Vaio; or, The Laptop',
						topic: 'mitch',
						author: 'icellusedkars',
						body: 'Call me Mitchell. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would buy a laptop about a little and see the codey part of the world. It is a way I have of driving off the spleen and regulating the circulation. Whenever I find myself growing grim about the mouth; whenever it is a damp, drizzly November in my soul; whenever I find myself involuntarily pausing before coffin warehouses, and bringing up the rear of every funeral I meet; and especially whenever my hypos get such an upper hand of me, that it requires a strong moral principle to prevent me from deliberately stepping into the street, and methodically knocking people’s hats off—then, I account it high time to get to coding as soon as I can. This is my substitute for pistol and ball. With a philosophical flourish Cato throws himself upon his sword; I quietly take to the laptop. There is nothing surprising in this. If they but knew it, almost all men in their degree, some time or other, cherish very nearly the same feelings towards the the Vaio with me.',
						created_at: expect.any(String),
						article_img_url:
							'https://images.pexels.com/photos/158651/news-newsletter-newspaper-information-158651.jpeg?w=700&h=700',
						votes: 0,
					});
				});
		});
		test('GET 200: adds comment_count to the return object', () => {
			return request(app)
				.get('/api/articles/1')
				.expect(200)
				.then(({ body }) => {
					const { article } = body;
					expect(article).toMatchObject({
						comment_count: 11,
					});
				});
		});
		test('GET 404: responds with a 404 error when valid but non-existent id is given', () => {
			return request(app)
				.get('/api/articles/500')
				.expect(404)
				.then(({ body }) => {
					expect(body.msg).toEqual('Not found');
				});
		});
		test('GET 400: responds with a 400 error when an invalid id is given', () => {
			return request(app)
				.get('/api/articles/garbage')
				.expect(400)
				.then(({ body }) => {
					expect(body.msg).toEqual('Bad request');
				});
		});
	});

	describe('PATCH /api/articles/:article_id', () => {
		test('PATCH 200: updates and returns the votes fot eh article with the corresponding id', () => {
			const votes = { inc_votes: 50 };
			return request(app)
				.patch('/api/articles/3')
				.send(votes)
				.expect(200)
				.then(({ body }) => {
					const { article } = body;
					expect(article).toMatchObject({
						article_id: 3,
						title: 'Eight pug gifs that remind me of mitch',
						topic: 'mitch',
						author: 'icellusedkars',
						body: 'some gifs',
						created_at: expect.any(String),
						article_img_url:
							'https://images.pexels.com/photos/158651/news-newsletter-newspaper-information-158651.jpeg?w=700&h=700',
						votes: 50,
					});
				});
		});
		test('PATCH 400: responds with a 400 error if passed data in the wrong format', () => {
			const votes = { garbageVotes: 50 };
			return request(app)
				.patch('/api/articles/3')
				.send(votes)
				.expect(400)
				.then(({ body }) => {
					expect(body.msg).toBe('Invalid input format');
				});
		});
		test('PATCH 400: responds with a 400 error if passed invalid data', () => {
			const votes = { inc_votes: 'sixty' };
			return request(app)
				.patch('/api/articles/3')
				.send(votes)
				.expect(400)
				.then(({ body }) => {
					expect(body.msg).toBe('Bad request');
				});
		});
		test('PATCH 404: responds with a 404 error if given a valid but non-existent article id', () => {
			const votes = { inc_votes: 100 };
			return request(app)
				.patch('/api/articles/100')
				.send(votes)
				.expect(404)
				.then(({ body }) => {
					expect(body.msg).toBe('Article not found');
				});
		});
		test('PATCH 400: responds with a 400 error if given an invalid article id', () => {
			const votes = { inc_votes: 100 };
			return request(app)
				.patch('/api/articles/garbage')
				.send(votes)
				.expect(400)
				.then(({ body }) => {
					expect(body.msg).toBe('Bad request');
				});
		});
	});
});

describe('/api/articles', () => {
	describe('GET /api/articles', () => {
		test('GET 200: responds with an array of the first 10 (default pagination) articles without the body property and with a comment count', () => {
			return request(app)
				.get('/api/articles')
				.expect(200)
				.then(({ body }) => {
					const { articles } = body;
					expect(articles.length).toBe(10);
					articles.forEach((article) => {
						expect(article).toMatchObject({
							author: expect.any(String),
							title: expect.any(String),
							article_id: expect.any(Number),
							topic: expect.any(String),
							created_at: expect.any(String),
							article_img_url: expect.any(String),
							votes: expect.any(Number),
							comment_count: expect.any(Number),
						});
					});
				});
		});
		test('GET 200: responds with articles sorted by date in descending order as a default', () => {
			return request(app)
				.get('/api/articles')
				.expect(200)
				.then(({ body }) => {
					const { articles } = body;
					expect(articles.length).toBe(10);
					expect(articles).toBeSortedBy('created_at', { descending: true });
				});
		});
		test('GET 200: returned article objects include a key total_count with the total number of articles', () => {
			return request(app)
				.get('/api/articles')
				.expect(200)
				.then(({ body }) => {
					const { articles } = body;
					expect(articles.length).toBe(10);
					articles.forEach((article) => {
						expect(article).toMatchObject({
							total_count: 13,
						});
					});
				});
		});
	});

	describe('POST /api/articles', () => {
		test('POST 201: Responds with the posted article that includes a url', () => {
			const postBody = {
				author: 'rogersop',
				title: 'Toby is my cat',
				body: 'Toby is a dignified little gentleman, with bald lips and a short backleg.',
				topic: 'cats',
				article_img_url: 'testtttt',
			};
			return request(app)
				.post('/api/articles')
				.send(postBody)
				.expect(201)
				.then(({ body }) => {
					const { newArticle } = body;
					expect(newArticle).toMatchObject({
						author: 'rogersop',
						title: 'Toby is my cat',
						body: 'Toby is a dignified little gentleman, with bald lips and a short backleg.',
						topic: 'cats',
						article_id: 14,
						votes: 0,
						created_at: expect.any(String),
						comment_count: 0,
						article_img_url: 'testtttt',
					});
				});
		});
		test('POST 201: Responds with the posted article with the default url if not given one', () => {
			const postBody = {
				author: 'rogersop',
				title: 'Toby is my cat',
				body: 'Toby is a dignified little gentleman, with bald lips and a short backleg.',
				topic: 'cats',
			};
			return request(app)
				.post('/api/articles')
				.send(postBody)
				.expect(201)
				.then(({ body }) => {
					const { newArticle } = body;
					expect(newArticle).toMatchObject({
						author: 'rogersop',
						title: 'Toby is my cat',
						body: 'Toby is a dignified little gentleman, with bald lips and a short backleg.',
						topic: 'cats',
						article_id: 14,
						votes: 0,
						created_at: expect.any(String),
						comment_count: 0,
						article_img_url:
							'https://images.pexels.com/photos/97050/pexels-photo-97050.jpeg?w=700&h=700',
					});
				});
		});
		test('POST 400: throws a 400 error when given an invalid object', () => {
			const postBody = {
				author: 'rogersop',
				body: 'Toby is a dignified little gentleman, with bald lips and a short backleg.',
			};
			return request(app)
				.post('/api/articles')
				.send(postBody)
				.expect(400)
				.then(({ body }) => {
					expect(body.msg).toBe('Bad request');
				});
		});
		test("POST 400: throws a 400 error when given an author that doesn't exist", () => {
			const postBody = {
				author: 'Ilovecats',
				title: 'Toby is my cat',
				body: 'Toby is a dignified little gentleman, with bald lips and a short backleg.',
				topic: 'cats',
			};
			return request(app)
				.post('/api/articles')
				.send(postBody)
				.expect(400)
				.then(({ body }) => {
					expect(body.msg).toBe('Bad request');
				});
		});
		test("POST 400: throws a 400 error when given a topic that doesn't exist", () => {
			const postBody = {
				author: 'rogersop',
				title: 'Toby is my cat',
				body: 'Toby is a dignified little gentleman, with bald lips and a short backleg.',
				topic: 'garbage',
			};
			return request(app)
				.post('/api/articles')
				.send(postBody)
				.expect(400)
				.then(({ body }) => {
					expect(body.msg).toBe('Bad request');
				});
		});
	});

	describe('GET /api/articles?topic', () => {
		test('GET 200 topic? : responds with an array of objects with the topic specified in the topic query', () => {
			return request(app)
				.get('/api/articles?topic=mitch&&limit=100')
				.expect(200)
				.then(({ body }) => {
					const { articles } = body;
					expect(articles.length).toBe(12);
					articles.forEach((article) => {
						expect(article).toMatchObject({
							article_id: expect.any(Number),
							author: expect.any(String),
							title: expect.any(String),
							topic: 'mitch',
							created_at: expect.any(String),
							article_img_url: expect.any(String),
							votes: expect.any(Number),
							comment_count: expect.any(Number),
						});
					});
				});
		});
		test('GET 404: throws a 404 error if the topic queries does not exist', () => {
			return request(app)
				.get('/api/articles?topic=garbage')
				.expect(404)
				.then(({ body }) => {
					expect(body.msg).toBe('Not found');
				});
		});
		test('GET 200: returns an empty array if the topic exists with no associated articles', () => {
			return request(app)
				.get('/api/articles?topic=paper')
				.expect(200)
				.then(({ body }) => {
					expect(body.articles).toEqual([]);
				});
		});
	});

	describe('GET /api/articles?sort_by=*', () => {
		test('GET 200: responds with articles ordered by given sort query', () => {
			return request(app)
				.get('/api/articles?sort_by=title')
				.expect(200)
				.then(({ body }) => {
					expect(body.articles).toBeSortedBy('title', { descending: true });
				});
		});
		test('GET 400: responds with a 400 error if given an invalid column to sort by', () => {
			return request(app)
				.get('/api/articles?sort_by=garbage')
				.expect(400)
				.then(({ body }) => {
					expect(body.msg).toBe('Invalid query');
				});
		});
	});

	describe('GET /api/articles?order=*', () => {
		test('GET 200: responds with articles ordered by given order value', () => {
			return request(app)
				.get('/api/articles?order=asc')
				.expect(200)
				.then(({ body }) => {
					expect(body.articles).toBeSortedBy('created_at');
				});
		});
		test('GET 400: responds with 400 if given an invalid order value', () => {
			return request(app)
				.get('/api/articles?order=garbage')
				.expect(400)
				.then(({ body }) => {
					expect(body.msg).toBe('Invalid query');
				});
		});
	});

	describe('GET /api/articles?limit=*', () => {
		test('GET 200: displays the number of entries specified by limit query', () => {
			return request(app)
				.get('/api/articles?limit=3')
				.expect(200)
				.then(({ body }) => {
					const { articles } = body;
					expect(articles.length).toBe(3);
					articles.forEach((article) => {
						expect(article).toMatchObject({
							author: expect.any(String),
							title: expect.any(String),
							article_id: expect.any(Number),
							topic: expect.any(String),
							created_at: expect.any(String),
							article_img_url: expect.any(String),
							votes: expect.any(Number),
							comment_count: expect.any(Number),
						});
					});
				});
		});
		test('GET 400: invalid limit query value', () => {
			return request(app)
				.get('/api/articles?limit=garbage')
				.expect(400)
				.then(({ body }) => {
					expect(body.msg).toBe('Bad request');
				});
		});
	});

	describe('GET /api/articles?p=*', () => {
		test('GET 200: displays the correct page given a p query value', () => {
			return request(app)
				.get('/api/articles?limit=2&&p=2')
				.expect(200)
				.then(({ body }) => {
					const { articles } = body;
					expect(articles.length).toBe(2);
					expect(articles[0]).toMatchObject({
						author: 'icellusedkars',
						title: 'Sony Vaio; or, The Laptop',
						article_id: 2,
						topic: 'mitch',
						created_at: expect.any(String),
						article_img_url:
							'https://images.pexels.com/photos/158651/news-newsletter-newspaper-information-158651.jpeg?w=700&h=700',
						votes: 0,
						comment_count: 0,
						total_count: 13,
					});
					expect(articles[1]).toMatchObject({
						author: 'butter_bridge',
						title: 'Moustache',
						article_id: 12,
						topic: 'mitch',
						created_at: expect.any(String),
						article_img_url:
							'https://images.pexels.com/photos/158651/news-newsletter-newspaper-information-158651.jpeg?w=700&h=700',
						votes: 0,
						comment_count: 0,
						total_count: 13,
					});
				});
		});
		test('GET 404: page number does not exist/too high', () => {
			return request(app)
				.get('/api/articles?p=6')
				.expect(404)
				.then(({ body }) => {
					expect(body.msg).toBe('Not found');
				});
		});
		test('GET 400: invalid p value', () => {
			return request(app)
				.get('/api/articles?p=garbage')
				.expect(400)
				.then(({ body }) => {
					expect(body.msg).toBe('Bad request');
				});
		});
	});

	describe('GET /api/articles?query1=*/query2=* etc', () => {
		test('GET 400: throws a 400 error if given an invalid query', () => {
			return request(app)
				.get('/api/articles?garbage=garbage')
				.expect(400)
				.then(({ body }) => {
					expect(body.msg).toBe('Invalid query');
				});
		});
		test('GET 200: total_count only counts filtered rows', () => {
			return request(app)
				.get('/api/articles?topic=mitch')
				.expect(200)
				.then(({ body }) => {
					const { articles } = body;
					expect(articles.length).toBe(10);
					articles.forEach((article) => {
						expect(article).toMatchObject({
							total_count: 12,
						});
					});
				});
		});
	});
});

describe('/api/articles/:article_id/comments', () => {
	describe('GET /api/articles/:article_id/comments', () => {
		test('GET 200: responds with an array of comments with the associated article id', () => {
			return request(app)
				.get('/api/articles/3/comments')
				.expect(200)
				.then(({ body }) => {
					const { comments } = body;
					expect(comments.length).toBe(2);
					comments.forEach((comment) => {
						expect(comment).toMatchObject({
							comment_id: expect.any(Number),
							body: expect.any(String),
							article_id: expect.any(Number),
							author: expect.any(String),
							votes: expect.any(Number),
							created_at: expect.any(String),
						});
					});
				});
		});

		test('GET 200: responds with an array of comments ordered by created_at in descending order', () => {
			return request(app)
				.get('/api/articles/1/comments')
				.expect(200)
				.then(({ body }) => {
					const { comments } = body;
					expect(comments.length).toBe(11);
					expect(comments).toBeSortedBy('created_at', { descending: true });
				});
		});

		test('GET 200: responds with an empty array when an existing article has no comments', () => {
			return request(app)
				.get('/api/articles/2/comments')
				.expect(200)
				.then(({ body }) => {
					expect(body).toEqual({ comments: [] });
				});
		});

		test('GET 404: responds with a 404 error if given a valid but non-existent id', () => {
			return request(app)
				.get('/api/articles/180/comments')
				.expect(404)
				.then(({ body }) => {
					expect(body.msg).toEqual('Not found');
				});
		});

		test('GET 400: responds with a 400 error if invalid article id is given', () => {
			return request(app)
				.get('/api/articles/garbage/comments')
				.expect(400)
				.then(({ body }) => {
					expect(body.msg).toEqual('Bad request');
				});
		});
	});

	describe('POST /api/articles/:article_id/comments', () => {
		test('POST 201: posts a new comment and returns the comment with an id', () => {
			const comment = {
				username: 'butter_bridge',
				body: 'Wow I totally agree!',
			};
			return request(app)
				.post('/api/articles/3/comments')
				.send(comment)
				.expect(201)
				.then(({ body }) => {
					expect(body.comment).toEqual({
						comment_id: 19,
						author: 'butter_bridge',
						body: 'Wow I totally agree!',
						article_id: 3,
						votes: 0,
						created_at: expect.any(String),
					});
				});
		});
		test('POST 404: throws a 404 error when given a valid but non-existent article id', () => {
			const comment = {
				username: 'butter_bridge',
				body: 'Wow I totally agree!',
			};
			return request(app)
				.post('/api/articles/101/comments')
				.send(comment)
				.expect(404)
				.then(({ body }) => {
					expect(body.msg).toEqual('Not found');
				});
		});
		test('POST 400: throws a 400 error when given an invalid article id', () => {
			const comment = {
				username: 'butter_bridge',
				body: 'Wow I totally agree!',
			};
			return request(app)
				.post('/api/articles/garbage/comments')
				.send(comment)
				.expect(400)
				.then(({ body }) => {
					expect(body.msg).toEqual('Bad request');
				});
		});

		test('POST 400: throws an error when the request body is in an invalid format', () => {
			const comment = {
				nickname: 'butter_bridge',
				body: 'Wow I totally agree!',
			};
			return request(app)
				.post('/api/articles/3/comments')
				.send(comment)
				.expect(400)
				.then(({ body }) => {
					expect(body.msg).toEqual('Bad request');
				});
		});
		test('POST 400: throws an error when the user given is invalid or does not exist in the users database', () => {
			const comment = {
				username: 'ilovecats',
				body: 'Wow I totally agree!',
			};
			return request(app)
				.post('/api/articles/3/comments')
				.send(comment)
				.expect(400)
				.then(({ body }) => {
					expect(body.msg).toEqual('Bad request');
				});
		});
	});
});

describe('/api/comments/:comment_id', () => {
	describe('DELETE /api/comments/:comment_id', () => {
		test('DELETE 204: deletes the comment with the associated id and responds with the status code only', () => {
			return request(app).delete('/api/comments/1').expect(204);
		});
		test("DELETE 404: responds with a 404 error if the given comment id doesn't exist", () => {
			return request(app)
				.delete('/api/comments/200')
				.expect(404)
				.then(({ body }) => {
					expect(body.msg).toBe('Comment id not found');
				});
		});
		test('DELETE 400: responds with a 400 error when given an invalid id', () => {
			return request(app)
				.delete('/api/comments/garbage')
				.expect(400)
				.then(({ body }) => {
					expect(body.msg).toBe('Bad request');
				});
		});
	});

	describe('PATCH /api/comments/:comment_id', () => {
		test('PATCH 200: responds with the updated comment object', () => {
			const patchObj = { inc_votes: 27 };
			return request(app)
				.patch('/api/comments/7')
				.send(patchObj)
				.expect(200)
				.then(({ body }) => {
					const { comment } = body;
					expect(comment).toMatchObject({
						comment_id: 7,
						body: 'Lobster pot',
						votes: 27,
						author: 'icellusedkars',
						article_id: 1,
						created_at: expect.any(String),
					});
				});
		});
		test('PATCH 404: responds with a 404 is a comment id is not found', () => {
			const patchObj = { inc_votes: 27 };
			return request(app)
				.patch('/api/comments/180')
				.send(patchObj)
				.expect(404)
				.then(({ body }) => {
					expect(body.msg).toBe('Not found');
				});
		});
		test('PATCH 400: Invalid format for vote request object', () => {
			const patchObj = { garbage: 27 };
			return request(app)
				.patch('/api/comments/7')
				.send(patchObj)
				.expect(400)
				.then(({ body }) => {
					expect(body.msg).toBe('Invalid input format');
				});
		});
		test('PATCH 400: Invalid data type', () => {
			const patchObj = { inc_votes: 'garbage' };
			return request(app)
				.patch('/api/comments/7')
				.send(patchObj)
				.expect(400)
				.then(({ body }) => {
					expect(body.msg).toBe('Bad request');
				});
		});
	});
});

describe('/api/users', () => {
	describe('GET /api/users', () => {
		test('GET 200: responds with an array of user objects', () => {
			return request(app)
				.get('/api/users')
				.expect(200)
				.then(({ body }) => {
					const { users } = body;
					expect(users.length).toBe(4);
					users.forEach((user) => {
						expect(user).toMatchObject({
							username: expect.any(String),
							name: expect.any(String),
							avatar_url: expect.any(String),
						});
					});
				});
		});
	});
});

describe('/api/users/:username', () => {
	describe('GET /api/uses/:username', () => {
		test('GET 200: responds with the user with the corresponding username', () => {
			return request(app)
				.get('/api/users/rogersop')
				.expect(200)
				.then(({ body }) => {
					const { user } = body;
					expect(user).toMatchObject({
						username: 'rogersop',
						name: 'paul',
						avatar_url:
							'https://avatars2.githubusercontent.com/u/24394918?s=400&v=4',
					});
				});
		});
		test("GET 404: responds with a 404 for a user that doesn't exist", () => {
			return request(app)
				.get('/api/users/ilovecats')
				.expect(404)
				.then(({ body }) => {
					expect(body.msg).toBe('User not found');
				});
		});
	});
});

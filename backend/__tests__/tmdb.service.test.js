/**
 * TESTES UNITÁRIOS PARA tmdb.service.js
 *
 * usa jest.resetModules() + require() no beforeEach para garantir
 * cache em memória limpo entre testes.
 */

let tmdbService;

beforeEach(() => {
  jest.resetModules();
  process.env.TMDB_BEARER_TOKEN = 'test-token';
  tmdbService = require('../services/tmdb.service');
});

afterEach(() => {
  jest.restoreAllMocks();
});

/**
 * Simula uma resposta fetch.
 * Usa mockImplementationOnce para que cada chamada consuma um mock independente.
 */
function mockFetchResponse(statusCode, body) {
  jest.spyOn(global, 'fetch').mockImplementationOnce(() =>
    Promise.resolve({
      ok: statusCode >= 200 && statusCode < 300,
      status: statusCode,
      json: () => Promise.resolve(body),
    })
  );
}

// Dados de exemplo no formato TMDB

const TMDB_MOVIE = {
  id: 42,
  title: 'Filme Incrivel',
  media_type: 'movie',
  poster_path: '/poster.jpg',
  overview: 'Sinopse do filme incrivel para validar o mapeamento.',
};

const TMDB_TV = {
  id: 99,
  name: 'Serie Incrivel',
  media_type: 'tv',
  poster_path: '/poster2.jpg',
  overview: 'Sinopse da serie para validar o mapeamento de tv.',
};

// -----------------------------------------------------------------------
// fetchFromTmdb
// -----------------------------------------------------------------------

describe('fetchFromTmdb', () => {
  test('deve retornar itens mapeados com id, type, title e image', async () => {
    mockFetchResponse(200, { results: [TMDB_MOVIE] }); // trending/movie
    mockFetchResponse(200, { results: [TMDB_TV] });    // trending/tv

    const result = await tmdbService.fetchFromTmdb('all', '');

    expect(result.stale).toBe(false);
    expect(Array.isArray(result.items)).toBe(true);

    const movie = result.items.find((i) => i.type === 'movie');
    expect(movie).toBeDefined();
    expect(movie.id).toBe('tmdb-42');
    expect(movie.title).toBe('Filme Incrivel');
    expect(movie.image).toContain('/poster.jpg');
  });

  test('deve filtrar apenas filmes quando type=movie', async () => {
    mockFetchResponse(200, { results: [TMDB_MOVIE] }); // trending/movie
    mockFetchResponse(200, { results: [TMDB_TV] });    // trending/tv

    const result = await tmdbService.fetchFromTmdb('movie', '');

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.every((i) => i.type === 'movie')).toBe(true);
  });

  test('deve usar endpoint search/multi quando search está preenchido', async () => {
    mockFetchResponse(200, { results: [{ ...TMDB_MOVIE, media_type: 'movie' }] });

    const result = await tmdbService.fetchFromTmdb('all', 'batman');

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0].title).toBe('Filme Incrivel');
  });

  test('deve retornar cache na segunda chamada sem nova requisição HTTP', async () => {
    mockFetchResponse(200, { results: [TMDB_MOVIE] });
    mockFetchResponse(200, { results: [TMDB_TV] });

    // Primeira chamada — preenche o cache
    await tmdbService.fetchFromTmdb('all', '');

    // Mede chamadas após o cache já estar preenchido
    const fetchSpy = jest.spyOn(global, 'fetch');
    fetchSpy.mockClear();

    // Segunda chamada — deve usar cache, sem chamar fetch
    const result2 = await tmdbService.fetchFromTmdb('all', '');

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result2.stale).toBe(false);
  });

  test('deve lançar erro quando TMDB retorna status 500', async () => {
    mockFetchResponse(500, { status_message: 'Internal Server Error' });

    await expect(tmdbService.fetchFromTmdb('all', 'erro-sem-cache')).rejects.toThrow();
  });
});

// -----------------------------------------------------------------------
// attachTrailers
// -----------------------------------------------------------------------

describe('attachTrailers', () => {
  test('deve retornar lista vazia sem fazer requisições', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');

    const result = await tmdbService.attachTrailers([]);

    expect(result).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('deve buscar e anexar trailerId de Trailer no YouTube', async () => {
    mockFetchResponse(200, {
      results: [{ site: 'YouTube', type: 'Trailer', key: 'yt_key_123' }],
    });

    const items = [{ id: 'tmdb-42', title: 'Teste', type: 'movie', trailerId: '' }];
    const result = await tmdbService.attachTrailers(items, 1);

    expect(result[0].trailerId).toBe('yt_key_123');
  });

  test('deve usar Teaser quando não há Trailer disponível', async () => {
    mockFetchResponse(200, {
      results: [{ site: 'YouTube', type: 'Teaser', key: 'teaser_key' }],
    });

    const items = [{ id: 'tmdb-99', title: 'Teste', type: 'series', trailerId: '' }];
    const result = await tmdbService.attachTrailers(items, 1);

    expect(result[0].trailerId).toBe('teaser_key');
  });

  test('deve ignorar itens que não têm id tmdb-*', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');

    const items = [{ id: 'local-1', title: 'Filme Local', type: 'movie', trailerId: '' }];
    const result = await tmdbService.attachTrailers(items);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result[0].trailerId).toBe('');
  });

  test('não deve alterar itens que já têm trailerId', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');

    const items = [{ id: 'tmdb-1', title: 'Ja tem trailer', type: 'movie', trailerId: 'existente' }];
    const result = await tmdbService.attachTrailers(items);

    // trailerId já preenchido — não deve fazer nova requisição
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result[0].trailerId).toBe('existente');
  });
});

'use strict';

const R = require('../../src/utils/response');

// Minimal Express-like mock
function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  res.send   = jest.fn().mockReturnValue(res);
  return res;
}

describe('response helpers', () => {

  it('success returns 200 with data', () => {
    const res = mockRes();
    R.success(res, { id: 1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1 } });
  });

  it('success includes meta when provided', () => {
    const res  = mockRes();
    const meta = { total: 10, page: 1 };
    R.success(res, [], 200, meta);
    const body = res.json.mock.calls[0][0];
    expect(body.meta).toEqual(meta);
  });

  it('created returns 201', () => {
    const res = mockRes();
    R.created(res, { id: 2 });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('noContent returns 204', () => {
    const res = mockRes();
    R.noContent(res);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it('badRequest returns 400 with BAD_REQUEST code', () => {
    const res = mockRes();
    R.badRequest(res, 'invalid');
    const body = res.json.mock.calls[0][0];
    expect(res.status).toHaveBeenCalledWith(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('BAD_REQUEST');
  });

  it('unauthorized returns 401', () => {
    const res = mockRes();
    R.unauthorized(res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('forbidden returns 403', () => {
    const res = mockRes();
    R.forbidden(res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('notFound returns 404', () => {
    const res = mockRes();
    R.notFound(res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('conflict returns 409', () => {
    const res = mockRes();
    R.conflict(res, 'already exists');
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('error includes details when provided', () => {
    const res     = mockRes();
    const details = [{ field: 'email', message: 'required' }];
    R.badRequest(res, 'Validation failed.', details);
    const body = res.json.mock.calls[0][0];
    expect(body.error.details).toEqual(details);
  });

});
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('contacts', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.string('email').notNullable();
    table.string('phone');
    table.string('subject').notNullable();
    table.text('message').notNullable();
    table.enu('status', ['new', 'in_progress', 'resolved', 'closed']).notNullable().defaultTo('new');
    table.enu('priority', ['low', 'medium', 'high']).notNullable().defaultTo('medium');
    table.string('assigned_to');
    table.text('response');
    table.timestamp('responded_at');
    table.timestamps(true, true);
    
    table.index(['email']);
    table.index(['status']);
    table.index(['priority']);
    table.index(['assigned_to']);
  });
  
  return knex.schema.createTable('newsletter_subscribers', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').notNullable().unique();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('subscribed_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('unsubscribed_at');
    table.timestamps(true, true);
    
    table.index(['email']);
    table.index(['is_active']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('newsletter_subscribers')
    .then(() => knex.schema.dropTableIfExists('contacts'));
};
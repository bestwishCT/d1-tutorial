export default {
	async fetch(request, env) {
		const { pathname } = new URL(request.url);
		const urlParts = pathname.split('/').filter(Boolean); // 拆分路径
		const method = request.method;
		const customerId = urlParts[2]; // 获取客户ID

			switch (method) {
				case 'GET':
					if (customerId) {
						return await this.getCustomer(customerId, env);
					}
					return await this.getAllCustomers(env);

				case 'POST':
					return await this.addCustomer(request, env);

				case 'PUT':
					if (!customerId) {
						return new Response('Customer ID is required for update', { status: 400 });
					}
					return await this.updateCustomer(customerId, request, env);

				case 'DELETE':
					if (!customerId) {
						return new Response('Customer ID is required for deletion', { status: 400 });
					}
					return await this.deleteCustomer(customerId, env);

				default:
					return new Response('Method Not Allowed', { status: 405 });
			}
		return new Response('Welcome to the API. Use /api/customers to manage customers.', { status: 200 });
	},

	async getCustomer(customerId, env) {
		try {
			const { results } = await env.DB.prepare(
				"SELECT * FROM Customers WHERE id = ?"
			).bind(customerId).all();

			if (results.length > 0) {
				return Response.json(results[0]);
			} else {
				return new Response('Customer not found', { status: 404 });
			}
		} catch (err) {
			return new Response('Error fetching customer', { status: 500 });
		}
	},

	async getAllCustomers(env) {
		try {
			const { results } = await env.DB.prepare(
				"SELECT * FROM Customers"
			).all();

			return Response.json(results); 
		} catch (err) {
			return new Response('Error fetching customers', { status: 500 });
		}
	},

	async addCustomer(request, env) {
		try {
			const customerData = await request.json();
			if (!customerData.name || !customerData.company) {
				return new Response('Invalid customer data', { status: 400 });
			}

			const { lastInsertRowId } = await env.DB.prepare(
				"INSERT INTO Customers (CompanyName, ContactName) VALUES (?, ?)"
			).bind(customerData.name, customerData.company).run();

			return new Response(`Customer created with ID: ${lastInsertRowId}`, { status: 201 });
		} catch (err) {
			return new Response('Error adding customer', { status: 500 });
		}
	},

	async updateCustomer(customerId, request, env) {
		try {
			const customerData = await request.json();

			if (!customerData.name && !customerData.company) {
				return new Response('Invalid customer data', { status: 400 });
			}

			const { changes } = await env.DB.prepare(
				"UPDATE Customers SET name = ?, company = ? WHERE id = ?"
			).bind(customerData.name, customerData.company, customerId).run();

			if (changes === 0) {
				return new Response('Customer not found or no changes made', { status: 404 });
			}

			return new Response('Customer updated successfully', { status: 200 });
		} catch (err) {
			return new Response('Error updating customer', { status: 500 });
		}
	},

	async deleteCustomer(customerId, env) {
		try {
			const { changes } = await env.DB.prepare(
				"DELETE FROM Customers WHERE id = ?"
			).bind(customerId).run();

			if (changes === 0) {
				return new Response('Customer not found', { status: 404 });
			}

			return new Response('Customer deleted successfully', { status: 200 });
		} catch (err) {
			return new Response('Error deleting customer', { status: 500 });
		}
	}
};

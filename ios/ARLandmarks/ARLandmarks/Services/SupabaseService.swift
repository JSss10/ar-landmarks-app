//
//  SupabaseService.swift
//  ARLandmarks
//
//  Created by Jessica Schneiter on 17.01.2026.
//

import Foundation

struct SupabaseService: Sendable {
    static let shared = SupabaseService()
    
    private let baseURL: String
    private let apiKey: String
    
    private init() {
        self.baseURL = Config.supabaseURL
        self.apiKey = Config.supabaseAnonKey
    }
    
    // MARK: - Public Methods
    
    func fetchLandmarks() async throws -> [Landmark] {
        let query = "select=*,category:categories(*)&is_active=eq.true&order=name.asc"
        return try await request(path: "landmarks", query: query)
    }
    
    func fetchCategories() async throws -> [Category] {
        let query = "select=*&order=sort_order.asc"
        return try await request(path: "categories", query: query)
    }
    
    // MARK: - Private Methods

    private func request<T: Decodable>(path: String, query: String, retries: Int = 3) async throws -> T {
        var lastError: Error?

        for attempt in 0..<retries {
            do {
                guard let url = URL(string: "\(baseURL)/rest/v1/\(path)?\(query)") else {
                    throw APIError.invalidURL
                }

                var request = URLRequest(url: url, timeoutInterval: 30)
                request.httpMethod = "GET"
                request.setValue(apiKey, forHTTPHeaderField: "apikey")
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                request.setValue("return=representation", forHTTPHeaderField: "Prefer")

                let (data, response) = try await URLSession.shared.data(for: request)

                guard let httpResponse = response as? HTTPURLResponse else {
                    throw APIError.invalidResponse
                }

                print("[\(path)] Status: \(httpResponse.statusCode)")

                switch httpResponse.statusCode {
                case 200...299:
                    let decoder = JSONDecoder()
                    do {
                        return try decoder.decode(T.self, from: data)
                    } catch {
                        throw APIError.decodingError(error.localizedDescription)
                    }

                case 401, 403:
                    throw APIError.unauthorized

                case 404:
                    throw APIError.notFound

                case 429:
                    if attempt < retries - 1 {
                        let delay = pow(2.0, Double(attempt))
                        print("Rate limited. Retrying in \(delay)s...")
                        try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
                        continue
                    }
                    throw APIError.httpError(httpResponse.statusCode)

                case 500...599:
                    if attempt < retries - 1 {
                        let delay = 0.5 * pow(2.0, Double(attempt))
                        print("Server error. Retrying in \(delay)s...")
                        try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
                        continue
                    }
                    throw APIError.httpError(httpResponse.statusCode)

                default:
                    throw APIError.httpError(httpResponse.statusCode)
                }
            } catch is CancellationError {
                throw APIError.cancelled
            } catch {
                lastError = error

                if attempt < retries - 1 {
                    try await Task.sleep(nanoseconds: 500_000_000)
                    continue
                }
            }
        }

        throw lastError ?? APIError.unknown
    }
}

// MARK: - API Errors

enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case httpError(Int)
    case notFound
    case unauthorized
    case decodingError(String)
    case cancelled
    case unknown

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid server response"
        case .httpError(let code):
            return "HTTP error: \(code)"
        case .notFound:
            return "Resource not found"
        case .unauthorized:
            return "Unauthorized - please check your API credentials"
        case .decodingError(let message):
            return "Data decoding error: \(message)"
        case .cancelled:
            return "Request was cancelled"
        case .unknown:
            return "An unknown error occurred"
        }
    }
}

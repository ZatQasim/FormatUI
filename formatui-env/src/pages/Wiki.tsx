import React from "react";

export const FormatWiki: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-900 text-gray-100 shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold mb-4 text-white">FormAT Wiki</h1>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2 text-gray-200">Overview</h2>
        <p className="text-gray-300">
          FormAT is a comprehensive digital assistant designed to provide powerful tools for productivity, 
          organization, and security. It combines a personal generator, search capabilities, task management, 
          and advanced security features into a unified interface for streamlined use.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2 text-gray-200">Core Modules & Features</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-300">
          <li>
            <strong>Generator:</strong> Generate resources like SEO strategy, blog posts, emails, code format and more.
          </li>
          <li>
            <strong>Search Engine:</strong> Allows users to quickly locate files, information, and resources 
            within the system, improving workflow and accessibility.
          </li>
          <li>
            <strong>Security Scanner:</strong> Monitors files and applications for potential threats, 
            ensuring safe and secure operations within the environment.
          </li>
          <li>
            <strong>Task Manager:</strong> Organizes tasks, schedules, and priorities to boost productivity 
            and track progress effectively.
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2 text-gray-200">Benefits</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-300">
          <li>Enhances productivity through smart task management and automation.</li>
          <li>Keeps the system secure and protected from potential threats.</li>
          <li>Provides instant access to information and files with the integrated search engine.</li>
          <li>Assists users in performing personal activites by managing their tasks and generating content.</li>
          <li>Creates a centralized, easy-to-use platform for managing digital workflows.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2 text-gray-200">Use Cases</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-300">
          <li>Managing personal or team projects with tasks and schedules.</li>
          <li>Quickly searching for files, resources, or relevant information.</li>
          <li>Keeping digital environments secure by scanning apps and files.</li>
          <li>Receiving guidance, suggestions, or automated assistance for daily operations.</li>
        </ul>
      </section>

      {/* Footer */}
      <footer className="mt-8 text-center text-sm text-gray-500">
        Made by me, ZatQasim (or Mohamed since that's my real name tbh)
      </footer>
    </div>
  );
};
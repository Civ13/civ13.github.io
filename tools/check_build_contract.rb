# The local theme has no ZIP extraction boundary. Keep the unused archive
# dependency out of the locked build and prevent remote-theme activation.
require 'bundler'
require 'yaml'

def check_config(config)
  raise 'Remote themes are outside this local-theme build contract' if config.key?('remote_theme')
  plugins = Array(config['plugins']) + Array(config['gems'])
  raise 'Remote-theme plugin must not be enabled' if plugins.include?('jekyll-remote-theme')
end

check_config(YAML.safe_load(File.read('_config.yml'), aliases: true))
names = Bundler.load.specs.map(&:name)
forbidden = names & %w[github-pages jekyll-remote-theme rubyzip]
raise "Unexpected archive build dependencies: #{forbidden.join(', ')}" unless forbidden.empty?

# Negative controls: even an empty remote-theme setting or the legacy plugin
# alias must fail, before any renderer could fetch or extract an archive.
[{ 'remote_theme' => '' }, { 'remote_theme' => 'owner/repo' },
 { 'plugins' => ['jekyll-remote-theme'] }, { 'gems' => ['jekyll-remote-theme'] }].each do |config|
  rejected = false
  begin
    check_config(config)
  rescue RuntimeError
    rejected = true
  end
  raise 'Remote-theme negative control was accepted' unless rejected
end
puts 'Local-theme dependency contract and negative controls passed'

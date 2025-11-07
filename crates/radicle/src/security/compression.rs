//! Compression utilities for bandwidth and storage optimization
//!
//! Provides zstd compression for reducing data transfer and storage costs

use std::io::{Read, Write};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum CompressionError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Compression failed: {0}")]
    CompressionFailed(String),
    #[error("Decompression failed: {0}")]
    DecompressionFailed(String),
}

/// Compression layer using zstd
///
/// Provides fast compression with excellent compression ratios
pub struct CompressionLayer {
    level: i32,
}

impl CompressionLayer {
    /// Create a new compression layer
    ///
    /// # Arguments
    /// * `level` - Compression level (1-22, higher = better compression but slower)
    ///   - 1-3: Fast, lower compression
    ///   - 3-7: Balanced (recommended)
    ///   - 8-22: Slower, higher compression
    pub fn new(level: i32) -> Self {
        let level = level.clamp(1, 22);
        Self { level }
    }

    /// Create a compression layer with default settings (level 3)
    pub fn default_level() -> Self {
        Self::new(3)
    }

    /// Compress data using zstd
    pub fn compress(&self, data: &[u8]) -> Result<Vec<u8>, CompressionError> {
        let compressed = zstd::encode_all(data, self.level)
            .map_err(|e| CompressionError::CompressionFailed(e.to_string()))?;

        Ok(compressed)
    }

    /// Decompress zstd data
    pub fn decompress(&self, compressed: &[u8]) -> Result<Vec<u8>, CompressionError> {
        let decompressed = zstd::decode_all(compressed)
            .map_err(|e| CompressionError::DecompressionFailed(e.to_string()))?;

        Ok(decompressed)
    }

    /// Compress data with a streaming encoder
    pub fn compress_stream<R: Read, W: Write>(
        &self,
        reader: R,
        writer: W,
    ) -> Result<u64, CompressionError> {
        let mut encoder = zstd::Encoder::new(writer, self.level)
            .map_err(|e| CompressionError::CompressionFailed(e.to_string()))?;

        let bytes_written = std::io::copy(&mut std::io::BufReader::new(reader), &mut encoder)?;

        encoder
            .finish()
            .map_err(|e| CompressionError::CompressionFailed(e.to_string()))?;

        Ok(bytes_written)
    }

    /// Decompress data with a streaming decoder
    pub fn decompress_stream<R: Read, W: Write>(
        &self,
        reader: R,
        writer: W,
    ) -> Result<u64, CompressionError> {
        let mut decoder = zstd::Decoder::new(reader)
            .map_err(|e| CompressionError::DecompressionFailed(e.to_string()))?;

        let bytes_read = std::io::copy(&mut decoder, &mut std::io::BufWriter::new(writer))?;

        Ok(bytes_read)
    }

    /// Calculate compression ratio
    pub fn compression_ratio(&self, original_size: usize, compressed_size: usize) -> f64 {
        if original_size == 0 {
            return 0.0;
        }
        (1.0 - (compressed_size as f64 / original_size as f64)) * 100.0
    }
}

impl Default for CompressionLayer {
    fn default() -> Self {
        Self::default_level()
    }
}

/// Compression statistics for monitoring
#[derive(Debug, Clone, Default)]
pub struct CompressionStats {
    pub total_bytes_in: u64,
    pub total_bytes_out: u64,
    pub operations: u64,
}

impl CompressionStats {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn record_compression(&mut self, input: u64, output: u64) {
        self.total_bytes_in += input;
        self.total_bytes_out += output;
        self.operations += 1;
    }

    pub fn average_ratio(&self) -> f64 {
        if self.total_bytes_in == 0 {
            return 0.0;
        }
        (1.0 - (self.total_bytes_out as f64 / self.total_bytes_in as f64)) * 100.0
    }

    pub fn total_savings(&self) -> u64 {
        self.total_bytes_in.saturating_sub(self.total_bytes_out)
    }
}

/// Async compression utilities for use with tokio
#[cfg(feature = "async")]
pub mod async_compression {
    use super::CompressionError;
    use async_compression::tokio::bufread::{ZstdDecoder, ZstdEncoder};
    use tokio::io::{AsyncRead, AsyncReadExt, AsyncWrite, AsyncWriteExt};

    pub struct AsyncCompressionLayer {
        level: u32,
    }

    impl AsyncCompressionLayer {
        pub fn new(level: i32) -> Self {
            Self {
                level: level.clamp(1, 22) as u32,
            }
        }

        pub async fn compress<R: AsyncRead + Unpin>(
            &self,
            reader: R,
        ) -> Result<Vec<u8>, CompressionError> {
            let mut encoder = ZstdEncoder::with_quality(reader, async_compression::Level::Precise(self.level));
            let mut compressed = Vec::new();
            encoder.read_to_end(&mut compressed).await?;
            Ok(compressed)
        }

        pub async fn decompress<R: AsyncRead + Unpin>(
            &self,
            reader: R,
        ) -> Result<Vec<u8>, CompressionError> {
            let mut decoder = ZstdDecoder::new(reader);
            let mut decompressed = Vec::new();
            decoder.read_to_end(&mut decompressed).await?;
            Ok(decompressed)
        }

        pub async fn compress_to<R: AsyncRead + Unpin, W: AsyncWrite + Unpin>(
            &self,
            reader: R,
            mut writer: W,
        ) -> Result<u64, CompressionError> {
            let mut encoder = ZstdEncoder::with_quality(reader, async_compression::Level::Precise(self.level));
            let bytes = tokio::io::copy(&mut encoder, &mut writer).await?;
            writer.flush().await?;
            Ok(bytes)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_basic_compression() {
        let compressor = CompressionLayer::new(3);
        let data = b"Hello, World! This is a test string that should compress well.";

        let compressed = compressor.compress(data).unwrap();
        assert!(compressed.len() < data.len());

        let decompressed = compressor.decompress(&compressed).unwrap();
        assert_eq!(data.as_slice(), decompressed.as_slice());
    }

    #[test]
    fn test_compression_ratio() {
        let compressor = CompressionLayer::new(3);
        let original_size = 1000;
        let compressed_size = 300;

        let ratio = compressor.compression_ratio(original_size, compressed_size);
        assert_eq!(ratio, 70.0); // 70% compression
    }

    #[test]
    fn test_compression_stats() {
        let mut stats = CompressionStats::new();

        stats.record_compression(1000, 300);
        stats.record_compression(2000, 600);

        assert_eq!(stats.operations, 2);
        assert_eq!(stats.total_bytes_in, 3000);
        assert_eq!(stats.total_bytes_out, 900);
        assert_eq!(stats.average_ratio(), 70.0);
        assert_eq!(stats.total_savings(), 2100);
    }

    #[test]
    fn test_different_compression_levels() {
        let data = b"This is a test string that will be compressed at different levels.".repeat(10);

        let compressor_low = CompressionLayer::new(1);
        let compressor_high = CompressionLayer::new(9);

        let compressed_low = compressor_low.compress(&data).unwrap();
        let compressed_high = compressor_high.compress(&data).unwrap();

        // Higher compression level should produce smaller output
        assert!(compressed_high.len() <= compressed_low.len());

        // Both should decompress correctly
        let decompressed_low = compressor_low.decompress(&compressed_low).unwrap();
        let decompressed_high = compressor_high.decompress(&compressed_high).unwrap();

        assert_eq!(data.as_slice(), decompressed_low.as_slice());
        assert_eq!(data.as_slice(), decompressed_high.as_slice());
    }
}
